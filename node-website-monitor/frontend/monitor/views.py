import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from .services.performance import check_status, analyze_seo, analyze_images
from .services.image_analyzer import analyze_uploaded_image, analyze_image_from_url
from .services.error_detector import detect_errors
from .services.advanced_performance import analyze_advanced_performance
from .services.advanced_seo import analyze_advanced_seo
from .services.security import analyze_security
from .models import AnalysisReport, AlertHistory


# ── Pages ─────────────────────────────────────────────────────────────────────

def home(request):
    return render(request, "monitor/index.html")


def history_page(request):
    return render(request, "monitor/history.html")


# ── Helper: save report to DB ─────────────────────────────────────────────────

def _save_report(url, check_data, errors_data, seo_data, perf_data, sec_data, image_data=None):
    """Persist a full analysis run to the database."""
    try:
        perf_score = perf_data.get("performance_score") if perf_data else None
        seo_score = seo_data.get("seo_score") if seo_data else None
        sec_score = sec_data.get("security_score") if sec_data else None

        overall = None
        scores = [s for s in [perf_score, seo_score, sec_score] if s is not None]
        if scores:
            overall = round(sum(scores) / len(scores))

        report = AnalysisReport.objects.create(
            url=url,
            status_code=check_data.get("status_code"),
            is_up=check_data.get("is_up", False),
            load_time=check_data.get("load_time"),
            ttfb=check_data.get("ttfb"),
            page_size_kb=check_data.get("page_size_kb"),
            perf_rating=check_data.get("perf_rating", ""),
            performance_score=perf_score,
            seo_score=seo_score,
            security_score=sec_score,
            overall_score=overall,
            page_title=seo_data.get("title", {}).get("text", "") if seo_data else "",
            meta_description=seo_data.get("meta_description", {}).get("text", "") if seo_data else "",
            is_https=check_data.get("url", "").startswith("https://"),
            has_ssl=sec_data.get("ssl", {}).get("valid", False) if sec_data else False,
            check_data=json.dumps(check_data),
            errors_data=json.dumps(errors_data),
            seo_data=json.dumps(seo_data),
            performance_data=json.dumps(perf_data),
            security_data=json.dumps(sec_data),
            image_data=json.dumps(image_data) if image_data else "",
        )

        # Save alerts
        all_alerts = []
        for a in check_data.get("alerts", []):
            all_alerts.append(AlertHistory(report=report, level=a.get("level", "info"),
                                           message=a.get("message", ""), category="performance"))
        for a in (perf_data or {}).get("alerts", []):
            all_alerts.append(AlertHistory(report=report, level=a.get("level", "info"),
                                           message=a.get("message", ""), category="performance"))
        for a in (seo_data or {}).get("alerts", []):
            all_alerts.append(AlertHistory(report=report, level=a.get("level", "info"),
                                           message=a.get("message", ""), category="seo"))
        for a in (sec_data or {}).get("alerts", []):
            all_alerts.append(AlertHistory(report=report, level=a.get("level", "info"),
                                           message=a.get("message", ""), category="security"))
        AlertHistory.objects.bulk_create(all_alerts)

        return report.id
    except Exception:
        return None


# ── Core APIs (existing) ──────────────────────────────────────────────────────

@csrf_exempt
def api_check(request):
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    return JsonResponse(check_status(url))


@csrf_exempt
def api_errors(request):
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    return JsonResponse(detect_errors(url))


@csrf_exempt
def api_seo(request):
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    return JsonResponse(analyze_seo(url))


@csrf_exempt
def api_image(request):
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    return JsonResponse(analyze_image_from_url(url))


@csrf_exempt
def api_upload_image(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST method required."}, status=405)
    if "image" not in request.FILES:
        return JsonResponse({"error": "No image file provided."}, status=400)

    image_file = request.FILES["image"]
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff"]
    content_type = image_file.content_type or ""
    if content_type not in allowed_types:
        name = image_file.name.lower()
        if not any(name.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif"]):
            return JsonResponse({"error": "Unsupported file type."}, status=400)
    if image_file.size > 20 * 1024 * 1024:
        return JsonResponse({"error": f"File too large. Max 20 MB."}, status=400)
    return JsonResponse(analyze_uploaded_image(image_file))


# Keep alias
api_image_upload = api_upload_image


# ── Advanced APIs (new) ───────────────────────────────────────────────────────

@csrf_exempt
def api_advanced_performance(request):
    """GET /api/advanced-performance/?url=...  — TTFB, CDN, render-blocking, lazy loading"""
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    return JsonResponse(analyze_advanced_performance(url))


@csrf_exempt
def api_advanced_seo(request):
    """GET /api/advanced-seo/?url=...  — headings, alt tags, broken links, sitemap, robots"""
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    return JsonResponse(analyze_advanced_seo(url))


@csrf_exempt
def api_security(request):
    """GET /api/security/?url=...  — HTTPS, SSL, security headers"""
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    return JsonResponse(analyze_security(url))


@csrf_exempt
def api_full_analysis(request):
    """
    GET /api/analyze/?url=...
    Runs ALL modules in one call and saves to DB.
    Returns combined results + report_id.
    """
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)

    # Normalize
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    check_data = check_status(url)
    errors_data = detect_errors(url)
    seo_data = analyze_advanced_seo(url)
    perf_data = analyze_advanced_performance(url)
    sec_data = analyze_security(url)
    image_data = analyze_images(url)

    # Compute overall score
    scores = []
    if perf_data.get("performance_score") is not None:
        scores.append(perf_data["performance_score"])
    if seo_data.get("seo_score") is not None:
        scores.append(seo_data["seo_score"])
    if sec_data.get("security_score") is not None:
        scores.append(sec_data["security_score"])
    overall_score = round(sum(scores) / len(scores)) if scores else None

    # Collect all alerts
    all_alerts = []
    for src, cat in [(check_data, "performance"), (errors_data, "error"),
                     (perf_data, "performance"), (seo_data, "seo"), (sec_data, "security")]:
        for a in src.get("alerts", []):
            a["category"] = cat
            all_alerts.append(a)

    # Save to DB
    report_id = _save_report(url, check_data, errors_data, seo_data, perf_data, sec_data, image_data)

    return JsonResponse({
        "url": url,
        "report_id": report_id,
        "overall_score": overall_score,
        "overall_label": _score_label(overall_score),
        "check": check_data,
        "errors": errors_data,
        "seo": seo_data,
        "performance": perf_data,
        "security": sec_data,
        "images": image_data,
        "all_alerts": all_alerts,
    })


# ── History APIs ──────────────────────────────────────────────────────────────

def api_history(request):
    """GET /api/history/  — list recent reports"""
    url_filter = request.GET.get("url", "").strip()
    limit = min(int(request.GET.get("limit", 20)), 100)

    qs = AnalysisReport.objects.all()
    if url_filter:
        qs = qs.filter(url__icontains=url_filter)

    reports = []
    for r in qs[:limit]:
        reports.append({
            "id": r.id,
            "url": r.url,
            "analyzed_at": r.analyzed_at.strftime("%Y-%m-%d %H:%M:%S"),
            "is_up": r.is_up,
            "status_code": r.status_code,
            "load_time": r.load_time,
            "performance_score": r.performance_score,
            "seo_score": r.seo_score,
            "security_score": r.security_score,
            "overall_score": r.overall_score,
            "page_title": r.page_title[:60] if r.page_title else "",
            "is_https": r.is_https,
        })

    return JsonResponse({"reports": reports, "total": qs.count()})


def api_report_detail(request, report_id):
    """GET /api/history/<id>/  — full report detail"""
    try:
        r = AnalysisReport.objects.get(id=report_id)
    except AnalysisReport.DoesNotExist:
        return JsonResponse({"error": "Report not found."}, status=404)

    alerts = list(r.alert_records.values("level", "message", "category", "created_at"))
    for a in alerts:
        a["created_at"] = a["created_at"].strftime("%Y-%m-%d %H:%M:%S")

    return JsonResponse({
        "id": r.id,
        "url": r.url,
        "analyzed_at": r.analyzed_at.strftime("%Y-%m-%d %H:%M:%S"),
        "is_up": r.is_up,
        "status_code": r.status_code,
        "load_time": r.load_time,
        "ttfb": r.ttfb,
        "page_size_kb": r.page_size_kb,
        "performance_score": r.performance_score,
        "seo_score": r.seo_score,
        "security_score": r.security_score,
        "overall_score": r.overall_score,
        "page_title": r.page_title,
        "is_https": r.is_https,
        "has_ssl": r.has_ssl,
        "check": r.get_check_data(),
        "seo": r.get_seo_data(),
        "performance": r.get_performance_data(),
        "security": r.get_security_data(),
        "images": r.get_image_data(),
        "alerts": alerts,
    })


def api_history_stats(request):
    """GET /api/history/stats/  — aggregate stats for charts"""
    url_filter = request.GET.get("url", "").strip()
    limit = min(int(request.GET.get("limit", 10)), 50)

    qs = AnalysisReport.objects.all()
    if url_filter:
        qs = qs.filter(url__icontains=url_filter)

    recent = list(qs[:limit])
    recent.reverse()  # chronological order for charts

    return JsonResponse({
        "labels": [r.analyzed_at.strftime("%m/%d %H:%M") for r in recent],
        "load_times": [r.load_time for r in recent],
        "performance_scores": [r.performance_score for r in recent],
        "seo_scores": [r.seo_score for r in recent],
        "security_scores": [r.security_score for r in recent],
        "overall_scores": [r.overall_score for r in recent],
    })


def _score_label(score):
    if score is None:
        return "N/A"
    if score >= 90:
        return "Excellent"
    elif score >= 75:
        return "Good"
    elif score >= 50:
        return "Needs Improvement"
    else:
        return "Poor"
