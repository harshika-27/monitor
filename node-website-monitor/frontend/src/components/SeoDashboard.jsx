import React, { useState, useRef } from 'react';
import { 
  FileText, CheckCircle2, XCircle, AlertTriangle, Layers, 
  Search, Link, Image, Globe, Sparkles 
} from 'lucide-react';
import { MissingAltPanel, BrokenLinksPanel, SeoWarningPanel } from './SeoDetailModal';

// ── PageSeoTableInline ────────────────────────────────────────────────────────
function PageSeoTableInline({ crawlData, title, metaDescription, headings, imageAnalysis, links, onAltClick, openWarning }) {
  const [expandedRow, setExpandedRow] = useState(null);

  const crawlPages = crawlData?.siteWideImages?.perPage || [];
  const rows = crawlPages.length > 0
    ? crawlPages.map(p => ({
        url:           p.pageLabel || p.pageUrl,
        fullUrl:       p.pageUrl,
        titleText:     p.pageTitle   || '',
        descText:      p.pageDesc    || '',
        h1Count:       p.h1Count     ?? null,
        h2Count:       p.h2Count     ?? null,
        h3Count:       p.h3Count     ?? null,
        totalImages:   p.totalImages || 0,
        missingAlt:    p.missingAlt  || 0,
        lastCrawled:   p.lastCrawled || null,
      }))
    : [{
        url:         '/ (homepage)',
        fullUrl:     '',
        titleText:   title?.text || '',
        descText:    metaDescription?.text || '',
        h1Count:     headings?.h1?.length ?? 0,
        h2Count:     headings?.h2?.length ?? 0,
        h3Count:     headings?.h3?.length ?? 0,
        totalImages: imageAnalysis?.totalImages || 0,
        missingAlt:  (imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0),
        lastCrawled: null,
      }];

  const titleCounts = {};
  const descCounts  = {};
  rows.forEach(r => {
    if (r.titleText) titleCounts[r.titleText] = (titleCounts[r.titleText] || 0) + 1;
    if (r.descText)  descCounts[r.descText]   = (descCounts[r.descText]   || 0) + 1;
  });

  const getRowWarnings = (r) => {
    const w = [];
    const isDupTitle = r.titleText && titleCounts[r.titleText] > 1;
    const isDupDesc  = r.descText  && descCounts[r.descText]   > 1;
    if (!r.titleText)              w.push({ sev: 'critical', text: 'Missing title tag',                          type: 'missing_title'   });
    else if (r.titleText.length < 30) w.push({ sev: 'warning', text: `Title too short (${r.titleText.length} chars, min 30)`, type: 'short_title' });
    else if (r.titleText.length > 60) w.push({ sev: 'warning', text: `Title too long (${r.titleText.length} chars, max 60)`,  type: 'long_title'  });
    if (isDupTitle)                w.push({ sev: 'warning', text: 'Duplicate title',                             type: 'short_title'     });
    if (!r.descText)               w.push({ sev: 'critical', text: 'Missing meta description',                   type: 'missing_meta_desc' });
    else if (r.descText.length < 120) w.push({ sev: 'warning', text: `Desc too short (${r.descText.length} chars, min 120)`, type: 'short_meta_desc' });
    else if (r.descText.length > 160) w.push({ sev: 'warning', text: `Desc too long (${r.descText.length} chars, max 160)`,  type: 'long_meta_desc'  });
    if (isDupDesc)                 w.push({ sev: 'warning', text: 'Duplicate description',                       type: 'short_meta_desc' });
    if (r.h1Count === 0)           w.push({ sev: 'critical', text: 'Missing H1',                                 type: 'missing_h1'      });
    else if (r.h1Count > 1)        w.push({ sev: 'warning', text: `Multiple H1 (${r.h1Count})`,                  type: 'multiple_h1'     });
    if (r.h2Count === 0 && r.h2Count !== null) w.push({ sev: 'warning', text: 'No H2 tags',                     type: 'missing_h2'      });
    if (r.missingAlt > 0)          w.push({ sev: 'warning', text: `${r.missingAlt} missing ALT`,                type: 'missing_alt'      });
    return w;
  };

  return (
    <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-slate-800 bg-slate-900/90 backdrop-blur text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-2.5 px-3 whitespace-nowrap">Page URL</th>
            <th className="py-2.5 px-3">Title</th>
            <th className="py-2.5 px-3 text-center">T.Len</th>
            <th className="py-2.5 px-3">Desc</th>
            <th className="py-2.5 px-3 text-center">D.Len</th>
            <th className="py-2.5 px-3 text-center">H1</th>
            <th className="py-2.5 px-3 text-center">H2</th>
            <th className="py-2.5 px-3 text-center">H3</th>
            <th className="py-2.5 px-3">Warnings</th>
            <th className="py-2.5 px-3 whitespace-nowrap">Last Crawled</th>
            <th className="py-2.5 px-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const warnings = getRowWarnings(row);
            const status   = warnings.length === 0 ? 'ok' : warnings.some(w => w.sev === 'critical') ? 'poor' : 'warning';
            const isExpanded = expandedRow === idx;

            return (
              <>
                <tr
                  key={idx}
                  className={`border-b border-slate-800/40 cursor-pointer transition-all ${isExpanded ? 'bg-indigo-500/5' : 'hover:bg-slate-800/10'}`}
                  onClick={() => setExpandedRow(isExpanded ? null : idx)}
                  title="Click to expand page details"
                >
                  {/* URL */}
                  <td className="py-2.5 px-3 font-mono text-indigo-400 text-[10px] max-w-[130px] truncate" title={row.fullUrl || row.url}>
                    {row.url}
                  </td>
                  {/* Title */}
                  <td className="py-2.5 px-3 max-w-[150px]">
                    <p className="text-[10px] truncate text-slate-300" title={row.titleText}>
                      {row.titleText || <span className="text-rose-400 italic">Missing</span>}
                    </p>
                  </td>
                  {/* Title len */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-bold text-[10px] ${row.titleText.length >= 30 && row.titleText.length <= 60 ? 'text-emerald-400' : row.titleText.length > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {row.titleText.length}
                    </span>
                  </td>
                  {/* Desc */}
                  <td className="py-2.5 px-3 max-w-[160px]">
                    <p className="text-[10px] truncate text-slate-400" title={row.descText}>
                      {row.descText || <span className="text-rose-400 italic">Missing</span>}
                    </p>
                  </td>
                  {/* Desc len */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-bold text-[10px] ${row.descText.length >= 120 && row.descText.length <= 160 ? 'text-emerald-400' : row.descText.length > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {row.descText.length}
                    </span>
                  </td>
                  {/* H1 */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-black text-sm ${row.h1Count === 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.h1Count ?? '—'}
                    </span>
                  </td>
                  {/* H2 */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-black text-sm ${(row.h2Count || 0) >= 2 ? 'text-emerald-400' : (row.h2Count || 0) === 1 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {row.h2Count ?? '—'}
                    </span>
                  </td>
                  {/* H3 */}
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-sm text-slate-400">{row.h3Count ?? '—'}</span>
                  </td>
                  {/* Warnings */}
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {warnings.length === 0
                        ? <span className="text-[9px] text-emerald-400 font-bold">✓ OK</span>
                        : warnings.slice(0, 2).map((w, wi) => (
                          <button
                            key={wi}
                            onClick={e => {
                              e.stopPropagation();
                              if (w.type === 'missing_alt') onAltClick();
                              else openWarning(w.type, w.text, '', row.fullUrl || row.url);
                            }}
                            className={`px-1.5 py-0.5 rounded border text-[8px] font-black cursor-pointer hover:opacity-80 transition-opacity ${
                              w.sev === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                            title="Click for details"
                          >
                            {w.sev === 'critical' ? '❌' : '⚠'} {w.text.split('(')[0].trim()}
                          </button>
                        ))}
                      {warnings.length > 2 && (
                        <span className="text-[8px] text-slate-500">+{warnings.length - 2}</span>
                      )}
                    </div>
                  </td>
                  {/* Last crawled */}
                  <td className="py-2.5 px-3 text-[9px] text-slate-500 font-mono whitespace-nowrap">
                    {row.lastCrawled ? new Date(row.lastCrawled).toLocaleDateString() : '—'}
                  </td>
                  {/* Status */}
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border whitespace-nowrap ${
                      status === 'ok'   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      status === 'poor' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {status === 'ok' ? '✓ GOOD' : status === 'poor' ? '❌ ISSUES' : '⚠ WARNINGS'}
                    </span>
                  </td>
                </tr>

                {/* Expanded detail row — #7 Page Details Expansion */}
                {isExpanded && (
                  <tr key={`exp-${idx}`} className="border-b border-indigo-500/20 bg-indigo-500/3">
                    <td colSpan={11} className="px-4 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Full URL</p>
                          <p className="font-mono text-indigo-400 break-all">{row.fullUrl || row.url}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Title ({row.titleText.length} chars)</p>
                          <p className="text-slate-300">{row.titleText || <span className="text-rose-400 italic">Missing</span>}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Meta Description ({row.descText.length} chars)</p>
                          <p className="text-slate-400 leading-relaxed">{row.descText || <span className="text-rose-400 italic">Missing</span>}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Heading Counts</p>
                          <div className="flex gap-3">
                            <span className={`font-black ${row.h1Count === 1 ? 'text-emerald-400' : 'text-rose-400'}`}>H1: {row.h1Count ?? 0}</span>
                            <span className={`font-black ${(row.h2Count || 0) >= 1 ? 'text-emerald-400' : 'text-amber-400'}`}>H2: {row.h2Count ?? 0}</span>
                            <span className="text-slate-400 font-bold">H3: {row.h3Count ?? 0}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Images</p>
                          <p className="text-slate-300">{row.totalImages} total
                            {row.missingAlt > 0 && (
                              <button onClick={onAltClick} className="ml-1.5 text-amber-400 font-bold hover:underline cursor-pointer">
                                ({row.missingAlt} missing ALT ↗)
                              </button>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Last Crawled</p>
                          <p className="text-slate-300">{row.lastCrawled ? new Date(row.lastCrawled).toLocaleString() : 'Not available'}</p>
                        </div>
                        {warnings.length > 0 && (
                          <div className="col-span-2 md:col-span-3">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">All Warnings</p>
                            <div className="flex flex-wrap gap-1.5">
                              {warnings.map((w, wi) => (
                                <button
                                  key={wi}
                                  onClick={() => {
                                    if (w.type === 'missing_alt') onAltClick();
                                    else openWarning(w.type, w.text, '', row.fullUrl || row.url);
                                  }}
                                  className={`px-2 py-0.5 rounded border text-[9px] font-bold cursor-pointer hover:opacity-80 ${
                                    w.sev === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  }`}
                                >
                                  {w.sev === 'critical' ? '❌' : '⚠'} {w.text}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function SeoDashboard({ seoData, crawlData = null }) {
  const [altSearch, setAltSearch] = useState('');
  const [showAltPanel,     setShowAltPanel]     = useState(false);
  const [showBrokenPanel,  setShowBrokenPanel]  = useState(false);
  const [activeWarning,    setActiveWarning]    = useState(null); // { type, label, value, pageUrl, items }

  const openWarning = (type, label, value = '', pageUrl = '', items = []) =>
    setActiveWarning({ type, label, value, pageUrl, items });

  if (!seoData) {
    return (
      <div className="glass-card p-10 text-center text-slate-500 max-w-2xl mx-auto my-6 animate-fade-in-up">
        <Globe className="h-10 w-10 text-slate-600 mx-auto mb-4 animate-bounce" />
        <h4 className="font-extrabold text-slate-400">No SEO Audit Metrics Available</h4>
        <p className="text-xs text-slate-500 mt-2">Run a scan above to see real-time Technical SEO audits, tags, and link integrity indices.</p>
      </div>
    );
  }

  const {
    title = { text: '', status: 'warning', message: 'No title tag detected.' },
    metaDescription = { text: '', status: 'warning', message: 'No description tag detected.' },
    headings = { h1: [], h2: [], h3: [], status: 'ok' },
    canonical = { text: '', status: 'ok', message: '' },
    robotsTxt = { exists: false, status: 'warning', message: 'Robots.txt check skipped.' },
    sitemap = { exists: false, status: 'warning', message: 'Sitemap check skipped.' },
    openGraph = { ogTitle: '', ogImage: '', status: 'warning' },
    twitterCard = { twitterCard: '', status: 'warning' },
    indexability = { isIndexable: true, status: 'ok', message: 'Site is indexable.' },
    mobileFriendliness = { viewportConfigured: true, touchTargetIssues: 0, status: 'ok' },
    keywordAnalysis = { topKeywords: [], status: 'ok' },
    links = { internalCount: 0, externalCount: 0, brokenCount: 0, brokenLinks: [], status: 'ok' },
    imageAnalysis = { totalImages: 0, withAlt: 0, missingAlt: 0, emptyAlt: 0, missingAltSrcs: [], status: 'ok', message: '' },
    seoScore = 100
  } = seoData;

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getGradientId = (score) => {
    if (score >= 90) return 'url(#seoEmeraldGrad)';
    if (score >= 75) return 'url(#seoAmberGrad)';
    return 'url(#seoRoseGrad)';
  };

  const filteredAltSrcs = (imageAnalysis?.missingAltSrcs || []).filter(item => {
    const srcStr = typeof item === 'string' ? item : (item?.src || '');
    return srcStr.toLowerCase().includes(altSearch.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>

      {/* ── Summary stats row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">SEO Score</span>
          <div className="mt-2">
            <h2 className={`text-2xl font-black tracking-tight ${getScoreColor(seoScore)}`}>{seoScore}</h2>
            <p className="text-[10px] mt-1 font-bold text-slate-500">Out of 100</p>
          </div>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Pages</span>
          <div className="mt-2">
            <h2 className="text-2xl font-black tracking-tight text-indigo-400">
              {crawlData?.pageCount?.estimatedPages || crawlData?.site_structure?.total_pages || '—'}
            </h2>
            <p className="text-[10px] mt-1 font-bold text-slate-500">
              {crawlData ? 'BFS crawled' : 'Run scan to count'}
            </p>
          </div>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Images</span>
          <div className="mt-2">
            <button
              onClick={() => setShowAltPanel(true)}
              className="text-2xl font-black tracking-tight text-violet-400 cursor-pointer hover:text-violet-300 transition-colors text-left"
              title="Click to see image ALT details"
            >
              {imageAnalysis?.totalImages || 0}
            </button>
            <p className="text-[10px] mt-1 font-bold text-slate-500">
              {((imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0)) > 0
                ? <button onClick={() => setShowAltPanel(true)} className="text-amber-400 cursor-pointer hover:underline">
                    {(imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0)} missing ALT ↗
                  </button>
                : 'All ALTs present'}
            </p>
          </div>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Internal Links</span>
          <div className="mt-2">
            <h2 className="text-2xl font-black tracking-tight text-sky-400">{links?.internalCount || 0}</h2>
            <p className="text-[10px] mt-1 font-bold text-slate-500">Same-domain links</p>
          </div>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Broken Links</span>
          <div className="mt-2">
            <button
              onClick={() => setShowBrokenPanel(true)}
              className={`text-2xl font-black tracking-tight cursor-pointer hover:opacity-80 transition-opacity text-left ${(links?.brokenCount || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}
              title="Click to see broken link details"
            >
              {links?.brokenCount || 0}
            </button>
            <p className="text-[10px] mt-1 font-bold text-slate-500">
              {(links?.brokenCount || 0) > 0
                ? <button onClick={() => setShowBrokenPanel(true)} className="text-rose-400 cursor-pointer hover:underline">View broken links ↗</button>
                : 'All healthy'}
            </p>
          </div>
        </div>
      </div>

      {/* ── SEO issues summary ─────────────────────────────────────────────── */}
      {seoData?.alerts && seoData.alerts.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-slate-200 font-extrabold text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="text-amber-400 h-4 w-4" />
            SEO Issues & Recommendations
            <span className="ml-auto px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black">{seoData.alerts.length}</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {seoData.alerts.map((alert, idx) => {
              // Map alert message to warning type for the modal
              const getWarningType = (msg) => {
                const m = msg.toLowerCase();
                if (m.includes('missing') && m.includes('title')) return 'missing_title';
                if (m.includes('title') && m.includes('short')) return 'short_title';
                if (m.includes('title') && m.includes('long'))  return 'long_title';
                if (m.includes('title length')) return 'short_title';
                if (m.includes('missing') && m.includes('description')) return 'missing_meta_desc';
                if (m.includes('description') && (m.includes('short') || m.includes('length'))) return 'short_meta_desc';
                if (m.includes('description') && m.includes('long')) return 'long_meta_desc';
                if (m.includes('missing h1') || (m.includes('h1') && m.includes('heading'))) return 'missing_h1';
                if (m.includes('multiple h1')) return 'multiple_h1';
                if (m.includes('h2')) return 'missing_h2';
                if (m.includes('alt')) return 'missing_alt';
                if (m.includes('broken') && m.includes('link')) return 'broken_links';
                return null;
              };
              const wType = getWarningType(alert.message);
              return (
                <div
                  key={idx}
                  onClick={wType ? () => {
                    if (wType === 'missing_alt') setShowAltPanel(true);
                    else if (wType === 'broken_links') setShowBrokenPanel(true);
                    else openWarning(wType, alert.message);
                  } : undefined}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-[10px] transition-all ${
                    alert.level === 'critical' ? 'bg-rose-500/5 border-rose-500/15 text-rose-300' :
                    alert.level === 'warning'  ? 'bg-amber-500/5 border-amber-500/15 text-amber-300' :
                                                 'bg-indigo-500/5 border-indigo-500/15 text-indigo-300'
                  } ${wType ? 'cursor-pointer hover:opacity-80' : ''}`}
                  title={wType ? 'Click for details' : undefined}
                >
                  {alert.level === 'critical' ? <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-400" /> :
                   alert.level === 'warning'  ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" /> :
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-400" />}
                  <p className="leading-relaxed">{alert.message}
                    {wType && <span className="ml-1.5 text-[8px] opacity-60">↗ click for details</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Broken link recommendations ────────────────────────────────────── */}
      {(links?.brokenCount || 0) > 0 && (
        <div className="glass-card p-6 border-l-4 border-l-rose-500">
          <h3 className="text-slate-200 font-extrabold text-sm mb-4 flex items-center gap-2">
            <XCircle className="text-rose-400 h-4 w-4" />
            Broken Link Recommendations — How to Fix
          </h3>
          <div className="space-y-3">
            {links.brokenLinks.map((bl, idx) => (
              <div key={idx} className="p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider shrink-0 mt-0.5">{bl.type}</span>
                  <p className="font-mono text-[10px] text-rose-300 break-all">{bl.url}</p>
                </div>
                <p className="text-[10px] text-slate-400">Reason: <span className="text-rose-300 font-bold">{bl.reason}</span></p>
                <div className="pt-2 border-t border-rose-500/15">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">How to Fix:</p>
                  <ul className="space-y-1">
                    {bl.type === 'internal' ? (
                      <>
                        <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-emerald-400">→</span> Update the link to point to the correct page URL</li>
                        <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-emerald-400">→</span> If the page was removed, set up a 301 redirect to the new URL</li>
                        <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-emerald-400">→</span> Check for typos in the link href attribute</li>
                      </>
                    ) : (
                      <>
                        <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-emerald-400">→</span> Replace with an updated external URL if the resource moved</li>
                        <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-emerald-400">→</span> Remove the link if the external resource no longer exists</li>
                        <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-emerald-400">→</span> Use a web archive (web.archive.org) to find the original content</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* SEO Circular Score */}
        <div className="col-span-12 md:col-span-4 glass-card p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider w-full text-left mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            SEO Performance Rating
          </h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="seoEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="seoAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="seoRoseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
              <circle cx="72" cy="72" r="62" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8"></circle>
              <circle
                cx="72"
                cy="72"
                r="62"
                fill="transparent"
                stroke={getGradientId(seoScore)}
                strokeWidth="8"
                strokeDasharray={389.5}
                strokeDashoffset={389.5 - (389.5 * seoScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-in-out"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-4xl font-black tracking-tight ${getScoreColor(seoScore)}`}>{seoScore}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">SEO Score</span>
            </div>
          </div>
        </div>

        {/* Search Engine Indexability Probes */}
        <div className="col-span-12 md:col-span-8 glass-card p-6 flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-indigo-400" />
              Indexability & Crawler Probes
            </span>
            
            <div className="space-y-3.5 mt-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Search Engine Indexable:</span>
                {indexability?.isIndexable ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Yes (Noindex Absent)
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> Blocked (Meta Noindex)
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Mobile Viewport Configured:</span>
                {mobileFriendliness?.viewportConfigured ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Fully Responsive
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> Suboptimal (Missing)
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Canonical Tag Configured:</span>
                {canonical?.text ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 truncate max-w-[240px]" title={canonical.text}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Configured
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Missing
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic mt-4 border-t border-slate-800/40 pt-3">
            * All variables crawled directly from live response body.
          </p>
        </div>

      </div>

      {/* HTML Header Tags & Crawl Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Meta elements */}
        <div className="col-span-12 md:col-span-6 glass-card p-6 space-y-4">
          <h3 className="text-slate-200 font-extrabold text-sm flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <FileText className="text-indigo-400 h-4.5 w-4.5" />
            HTML Header Metadata
          </h3>
          
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-2">Meta Title Tag</span>
              <div className="p-3 bg-dark-800/30 rounded-xl border border-slate-800/60 text-slate-300 font-medium font-mono break-all leading-normal">
                {title?.text || '—'}
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block">{title?.message}</span>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-2">Meta Description</span>
              <div className="p-3 bg-dark-800/30 rounded-xl border border-slate-800/60 text-slate-300 font-medium leading-relaxed">
                {metaDescription?.text || '—'}
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block">{metaDescription?.message}</span>
            </div>
          </div>
        </div>

        {/* Crawlability Files Validation */}
        <div className="col-span-12 md:col-span-6 glass-card p-6 space-y-4">
          <h3 className="text-slate-200 font-extrabold text-sm flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Globe className="text-indigo-400 h-4.5 w-4.5" />
            Crawlability & File Validations
          </h3>
          
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-2">robots.txt Validation</span>
              <div className={`p-3.5 rounded-xl border text-slate-300 font-medium ${robotsTxt?.exists ? 'bg-emerald-950/15 border-emerald-900/25 text-emerald-300' : 'bg-rose-950/15 border-rose-900/25 text-rose-300'}`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold">{robotsTxt?.exists ? 'Found & Active' : 'Missing File'}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${robotsTxt?.exists ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {robotsTxt?.status?.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{robotsTxt?.message}</p>
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-2">sitemap.xml Validation</span>
              <div className={`p-3.5 rounded-xl border text-slate-300 font-medium ${sitemap?.exists ? 'bg-emerald-950/15 border-emerald-900/25 text-emerald-300' : 'bg-rose-950/15 border-rose-900/25 text-rose-300'}`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold">{sitemap?.exists ? 'Found & Parsed' : 'Missing Index'}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sitemap?.exists ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {sitemap?.status?.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{sitemap?.message}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Heading Structure & Keyword Density mapping */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Hierarchy and keywords density map */}
        <div className="col-span-12 md:col-span-6 glass-card p-6 space-y-6">
          <div>
            <h3 className="text-slate-200 font-extrabold text-sm border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Layers className="text-indigo-400 h-4.5 w-4.5" />
              H1 Page Headings Hierarchy
            </h3>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {headings?.h1?.length === 0 ? (
                <div className="p-3.5 bg-rose-950/10 border border-rose-900/20 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="text-rose-400 h-4 w-4 shrink-0" />
                  <span className="text-rose-400 text-xs font-bold leading-normal">No H1 heading tag detected on this page! Suboptimal structural indexability.</span>
                </div>
              ) : (
                headings.h1.map((h, i) => (
                  <div key={i} className="text-xs p-2.5 bg-indigo-950/15 border border-indigo-900/25 text-indigo-350 rounded-lg font-semibold flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0 animate-pulse"></span>
                    {h}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-slate-200 font-extrabold text-sm border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Sparkles className="text-indigo-400 h-4.5 w-4.5" />
              Top 5 High-Frequency Keyword Density
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {keywordAnalysis?.topKeywords?.length === 0 ? (
                <div className="text-slate-500 text-xs italic py-2">No frequency keyword analysis performed.</div>
              ) : (
                keywordAnalysis.topKeywords.map((k, idx) => (
                  <div key={idx} className="px-3.5 py-2 bg-dark-800/40 border border-slate-800 rounded-xl text-xs flex items-center gap-2.5 transition-all hover:border-indigo-500/30">
                    <span className="text-indigo-400 font-bold">{k.keyword}</span>
                    <span className="text-slate-500 font-mono text-[10px] bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">{k.count} times</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Image Alt tags analysis */}
        <div className="col-span-12 md:col-span-6 glass-card p-6 space-y-4">
          <h3 className="text-slate-200 font-extrabold text-sm border-b border-slate-800 pb-3 flex justify-between items-center">
            <span className="flex items-center gap-2">
              <Image className="text-indigo-400 h-4.5 w-4.5" />
              Image Alt Tag Compliance
            </span>
            {imageAnalysis?.totalImages > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800/60 text-slate-400 rounded-md">
                Compliance: {imageAnalysis.withAlt} / {imageAnalysis.totalImages}
              </span>
            )}
          </h3>
          
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3.5 text-center">
              <div className="p-3 bg-dark-800/30 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 text-[10px] font-bold block uppercase mb-1">Total Images</span>
                <span className="text-lg font-black text-slate-350">{imageAnalysis?.totalImages || 0}</span>
              </div>
              <div className="p-3 bg-dark-800/30 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 text-[10px] font-bold block uppercase mb-1">Valid ALT</span>
                <span className="text-lg font-black text-emerald-400">{imageAnalysis?.withAlt || 0}</span>
              </div>
              <div className="p-3 bg-dark-800/30 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 text-[10px] font-bold block uppercase mb-1">Missing ALT</span>
                <span className="text-lg font-black text-rose-455">
                  {(imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0)}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">{imageAnalysis?.message}</p>

            {imageAnalysis?.missingAltSrcs?.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-rose-400 font-bold uppercase tracking-wider block text-[9px]">Missing ALT descriptive tags list</span>
                  <div className="relative flex items-center w-36">
                    <Search className="absolute left-2 text-slate-500 h-3 w-3" />
                    <input 
                      type="text" 
                      placeholder="Filter by src..." 
                      className="w-full bg-slate-950/60 border border-slate-800 rounded px-2 py-0.5 text-[9px] pl-6 font-medium text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500"
                      value={altSearch}
                      onChange={e => setAltSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {filteredAltSrcs.length === 0 ? (
                    <div className="text-[9px] text-slate-600 italic">No matching image sources.</div>
                  ) : (
                    filteredAltSrcs.map((item, i) => {
                      const src = typeof item === 'string' ? item : (item?.src || '');
                      const suggestedAlt = typeof item === 'string' ? null : (item?.suggestedAlt || item?.suggested_alt);
                      
                      return (
                        <div key={i} className="p-2.5 bg-rose-950/10 border border-rose-900/15 rounded-xl space-y-1.5 transition-all hover:bg-rose-950/20">
                          <div className="font-mono text-[9px] text-rose-300 truncate" title={src}>
                            <span className="text-rose-500 font-bold">SRC:</span> {src}
                          </div>
                          {suggestedAlt && (
                            <div className="flex items-center gap-1.5 text-[9.5px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg text-emerald-300 font-semibold w-fit">
                              <Sparkles className="h-3 w-3 text-emerald-400 shrink-0 animate-pulse" />
                              <span>Suggested ALT: <strong className="text-emerald-200 italic">"{suggestedAlt}"</strong></span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Crawled Links index */}
      <div className="glass-card p-6">
        <h3 className="text-slate-200 font-extrabold text-sm border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
          <span className="flex items-center gap-2">
            <Link className="text-indigo-400 h-4.5 w-4.5" />
            Crawled Links Integrity Audit
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-850/60 text-slate-400 rounded-md">
            Internal: {links?.internalCount || 0} • External: {links?.externalCount || 0}
          </span>
        </h3>
        
        <div className="space-y-3">
          {links?.brokenCount === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs italic flex flex-col items-center justify-center gap-2 bg-dark-900/20 border border-dashed border-slate-800 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              All internal and external links are structurally verified and operational (zero broken links).
            </div>
          ) : (
            <div className="space-y-2.5">
              <span className="text-rose-455 font-bold uppercase tracking-wider block text-[9px] mb-2">Detected Broken Link Anomalies</span>
              <div className="space-y-2">
                {links.brokenLinks.map((bl, idx) => (
                  <div key={idx} className="p-3 bg-rose-950/10 border border-rose-900/20 rounded-xl flex justify-between items-center text-xs">
                    <div className="truncate max-w-[80%] pr-4">
                      <span className="font-extrabold text-rose-400 uppercase tracking-widest text-[9px] block mb-0.5">{bl.type} URL Broken</span>
                      <span className="font-mono text-slate-350 break-all truncate block" title={bl.url}>{bl.url}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-455 font-bold tracking-wide uppercase text-[9px] shrink-0 border border-rose-500/20">
                      {bl.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SEO Optimization Details ───────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Sparkles className="text-indigo-400 h-5 w-5" />
          SEO Optimization Details
        </h3>

        {/* SEO Health Score summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border text-xs ${title?.text ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-rose-500/5 border-rose-500/15'}`}>
            <p className="font-bold uppercase tracking-wider text-[9px] mb-1 text-slate-400">Title Tag</p>
            <p className={`font-extrabold text-sm ${title?.text ? 'text-emerald-400' : 'text-rose-400'}`}>
              {title?.text ? `${title.text.length} chars` : 'MISSING'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{title?.message}</p>
          </div>
          <div className={`p-4 rounded-xl border text-xs ${metaDescription?.text ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-rose-500/5 border-rose-500/15'}`}>
            <p className="font-bold uppercase tracking-wider text-[9px] mb-1 text-slate-400">Meta Description</p>
            <p className={`font-extrabold text-sm ${metaDescription?.text ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metaDescription?.text ? `${metaDescription.text.length} chars` : 'MISSING'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{metaDescription?.message}</p>
          </div>
          <div className={`p-4 rounded-xl border text-xs ${(headings?.h1?.length === 1) ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-amber-500/5 border-amber-500/15'}`}>
            <p className="font-bold uppercase tracking-wider text-[9px] mb-1 text-slate-400">H1 Headings</p>
            <p className={`font-extrabold text-sm ${headings?.h1?.length === 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {headings?.h1?.length || 0} found
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              {headings?.h1?.length === 0 ? 'No H1 tag — add one' : headings?.h1?.length > 1 ? 'Multiple H1 — use only one' : 'Single H1 — optimal'}
            </p>
          </div>
        </div>

        {/* Heading Structure */}
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2.5">Heading Structure</p>
          <div className="space-y-1.5">
            {headings?.h1?.length === 0 && headings?.h2?.length === 0 && headings?.h3?.length === 0 ? (
              <div className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl flex items-center gap-2 text-xs text-rose-400">
                <XCircle className="h-4 w-4 shrink-0" /> No heading tags detected on this page.
              </div>
            ) : (
              <>
                {(headings?.h1 || []).map((h, i) => (
                  <div key={`h1-${i}`} className="flex items-center gap-2 p-2.5 bg-indigo-500/5 border border-indigo-500/15 rounded-lg">
                    <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded shrink-0">H1</span>
                    <span className="text-xs text-slate-300 truncate">{h}</span>
                  </div>
                ))}
                {(headings?.h2 || []).slice(0, 5).map((h, i) => (
                  <div key={`h2-${i}`} className="flex items-center gap-2 p-2 bg-slate-800/20 border border-slate-800/40 rounded-lg ml-3">
                    <span className="text-[9px] font-black text-slate-400 bg-slate-800/40 px-1.5 py-0.5 rounded shrink-0">H2</span>
                    <span className="text-xs text-slate-400 truncate">{h}</span>
                  </div>
                ))}
                {headings?.h2?.length > 5 && (
                  <p className="text-[9px] text-slate-500 italic ml-3">+{headings.h2.length - 5} more H2 headings</p>
                )}
                {(headings?.h3 || []).slice(0, 3).map((h, i) => (
                  <div key={`h3-${i}`} className="flex items-center gap-2 p-2 bg-slate-800/10 border border-slate-800/30 rounded-lg ml-6">
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-800/30 px-1.5 py-0.5 rounded shrink-0">H3</span>
                    <span className="text-xs text-slate-500 truncate">{h}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ALT Tag summary */}
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2.5">ALT Tag Coverage</p>
          <div className="flex items-center gap-4 p-3 bg-slate-800/20 border border-slate-800/40 rounded-xl text-xs">
            <div className="text-center">
              <p className="text-lg font-black text-slate-200">{imageAnalysis?.totalImages || 0}</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold">Total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-emerald-400">{imageAnalysis?.withAlt || 0}</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold">With ALT</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-rose-400">{(imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0)}</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold">Missing</p>
            </div>
            <div className="flex-1">
              <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800 mt-1">
                {(() => {
                  const total = imageAnalysis?.totalImages || 0;
                  const pct = total > 0 ? Math.round(((imageAnalysis?.withAlt || 0) / total) * 100) : 100;
                  return <div className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />;
                })()}
              </div>
              <p className="text-[9px] text-slate-500 mt-1 text-right">
                {imageAnalysis?.totalImages > 0 ? Math.round(((imageAnalysis?.withAlt || 0) / imageAnalysis.totalImages) * 100) : 100}% compliant
              </p>
            </div>
          </div>
        </div>

        {/* SEO Recommendations */}
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2.5">SEO Recommendations</p>
          <div className="space-y-2">
            {(() => {
              const recs = [];
              if (!metaDescription?.text) recs.push({ level: 'critical', text: 'Add a meta description (120–160 chars) to improve search engine click-through rates.' });
              if (metaDescription?.text && (metaDescription.text.length < 120 || metaDescription.text.length > 160)) recs.push({ level: 'warning', text: `Improve meta description length: currently ${metaDescription.text.length} chars, ideal is 120–160.` });
              if (!title?.text) recs.push({ level: 'critical', text: 'Add a page title tag (30–65 chars). Missing title severely hurts SEO rankings.' });
              if (title?.text && (title.text.length < 30 || title.text.length > 65)) recs.push({ level: 'warning', text: `Improve title length: currently ${title.text.length} chars, ideal is 30–65.` });
              if (headings?.h1?.length === 0) recs.push({ level: 'critical', text: 'Add exactly one H1 heading to every page for clear topic signaling.' });
              if (headings?.h1?.length > 1) recs.push({ level: 'warning', text: `Reduce H1 count to one (currently ${headings.h1.length}). Multiple H1 tags confuse search engines.` });
              const missingAlt = (imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0);
              if (missingAlt > 0) recs.push({ level: 'warning', text: `Add ALT text to ${missingAlt} image${missingAlt > 1 ? 's' : ''}. Missing ALT tags hurt accessibility and image SEO.` });
              if (links?.brokenCount > 0) recs.push({ level: 'warning', text: `Fix ${links.brokenCount} broken link${links.brokenCount > 1 ? 's' : ''}. Broken links hurt crawlability and user experience.` });
              if (!canonical?.text) recs.push({ level: 'warning', text: 'Add a canonical URL tag to prevent duplicate content issues.' });
              if (!robotsTxt?.exists) recs.push({ level: 'warning', text: 'Create a robots.txt file to guide search engine crawlers.' });
              if (!sitemap?.exists) recs.push({ level: 'warning', text: 'Add a sitemap.xml to help search engines discover all your pages.' });
              if (recs.length === 0) recs.push({ level: 'ok', text: 'All major SEO factors are properly configured. Keep monitoring for changes.' });
              return recs;
            })().map((rec, idx) => (
              <div key={idx} className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-[10px] leading-relaxed ${
                rec.level === 'critical' ? 'bg-rose-500/5 border-rose-500/15 text-rose-300' :
                rec.level === 'warning'  ? 'bg-amber-500/5 border-amber-500/15 text-amber-300' :
                                           'bg-emerald-500/5 border-emerald-500/15 text-emerald-300'
              }`}>
                {rec.level === 'critical' ? <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-400" /> :
                 rec.level === 'warning'  ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" /> :
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />}
                <span>{rec.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page SEO Analysis Table — #5 warnings, #6 heading, #7 expand, #8 last modified ── */}
      <div className="glass-card p-6">
        <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <FileText className="text-indigo-400 h-5 w-5" />
          Page SEO Analysis
          {crawlData?.siteWideImages?.perPage?.length > 0 && (
            <span className="ml-auto px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black">
              {crawlData.siteWideImages.perPage.length} pages
            </span>
          )}
        </h3>
        <PageSeoTableInline
          crawlData={crawlData}
          title={title}
          metaDescription={metaDescription}
          headings={headings}
          imageAnalysis={imageAnalysis}
          links={links}
          onAltClick={() => setShowAltPanel(true)}
          openWarning={openWarning}
        />
        {(!crawlData || !crawlData.siteWideImages?.perPage?.length) && (
          <p className="text-[10px] text-slate-500 italic mt-3">
            * Showing homepage data only. Run Scan then wait for deep crawl to see all pages.
          </p>
        )}
      </div>


      {(() => {
        const crawlPages = crawlData?.siteWideImages?.perPage || [];
        const rows = crawlPages.length > 0
          ? crawlPages.map(p => ({ url: p.pageLabel || p.pageUrl, titleText: p.pageTitle || '', descText: p.pageDesc || '' }))
          : [{ url: '/ (homepage)', titleText: title?.text || '', descText: metaDescription?.text || '' }];

        const titleCounts = {};
        const descCounts  = {};
        rows.forEach(r => {
          if (r.titleText) titleCounts[r.titleText] = (titleCounts[r.titleText] || 0) + 1;
          if (r.descText)  descCounts[r.descText]   = (descCounts[r.descText]   || 0) + 1;
        });

        const warnings = [];
        rows.forEach(r => {
          if (!r.titleText) {
            warnings.push({ url: r.url, issue: 'Missing Title', value: '0 chars', fix: 'Add a descriptive page title (30–60 characters)', level: 'critical' });
          } else if (r.titleText.length < 30) {
            warnings.push({ url: r.url, issue: 'Title Too Short', value: `${r.titleText.length} chars`, fix: 'Recommended: 30–60 characters. Expand the title to better describe the page.', level: 'warning' });
          } else if (r.titleText.length > 60) {
            warnings.push({ url: r.url, issue: 'Title Too Long', value: `${r.titleText.length} chars`, fix: 'Recommended: 30–60 characters. Shorten the title to avoid truncation in SERPs.', level: 'warning' });
          }
          if (titleCounts[r.titleText] > 1) {
            warnings.push({ url: r.url, issue: 'Duplicate Title', value: `"${r.titleText.substring(0, 30)}…"`, fix: 'Each page should have a unique title tag to rank independently.', level: 'warning' });
          }
          if (!r.descText) {
            warnings.push({ url: r.url, issue: 'Missing Meta Description', value: '0 chars', fix: 'Add a meta description (120–160 characters) to improve click-through rates.', level: 'critical' });
          } else if (r.descText.length < 120) {
            warnings.push({ url: r.url, issue: 'Meta Description Too Short', value: `${r.descText.length} chars`, fix: 'Recommended: 120–160 characters. Expand the description to improve SEO visibility.', level: 'warning' });
          } else if (r.descText.length > 160) {
            warnings.push({ url: r.url, issue: 'Meta Description Too Long', value: `${r.descText.length} chars`, fix: 'Recommended: 120–160 characters. Shorten to avoid truncation in search results.', level: 'warning' });
          }
          if (descCounts[r.descText] > 1 && r.descText) {
            warnings.push({ url: r.url, issue: 'Duplicate Meta Description', value: `"${r.descText.substring(0, 30)}…"`, fix: 'Each page should have a unique meta description.', level: 'warning' });
          }
        });

        if (warnings.length === 0) return (
          <div className="glass-card p-5 flex items-center gap-3 border-l-4 border-l-emerald-500">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-extrabold text-emerald-400">No SEO Warnings</p>
              <p className="text-[10px] text-slate-500 mt-0.5">All page titles and meta descriptions are within recommended ranges.</p>
            </div>
          </div>
        );

        return (
          <div className="glass-card p-6">
            <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
              <AlertTriangle className="text-amber-400 h-5 w-5" />
              SEO Warnings
              <span className="ml-auto px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-black">{warnings.length} issues</span>
            </h3>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0">
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/80 backdrop-blur">
                    <th className="py-2.5 px-3">Page URL</th>
                    <th className="py-2.5 px-3">Issue Type</th>
                    <th className="py-2.5 px-3">Current Value</th>
                    <th className="py-2.5 px-3">Recommended Fix</th>
                  </tr>
                </thead>
                <tbody>
                  {warnings.map((w, idx) => (
                    <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/10 transition-all">
                      <td className="py-2.5 px-3 font-mono text-indigo-400 text-[10px] max-w-[140px] truncate" title={w.url}>{w.url}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${w.level === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {w.issue}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono text-[10px]">{w.value}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[10px] max-w-[220px]">{w.fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ── Heading Structure Analysis ────────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <Layers className="text-indigo-400 h-5 w-5" />
          Heading Structure Analysis
        </h3>

        {/* Heading score */}
        {(() => {
          let score = 100;
          const warns = [];
          if (headings?.h1?.length === 0) { score -= 40; warns.push({ level: 'critical', text: 'Missing H1 — every page needs exactly one H1 heading for topic clarity.' }); }
          else if (headings?.h1?.length > 1) { score -= 20; warns.push({ level: 'warning', text: `Multiple H1 tags (${headings.h1.length}) — use only one H1 per page.` }); }
          if (headings?.h2?.length === 0) { score -= 15; warns.push({ level: 'warning', text: 'No H2 tags — add H2 headings to structure page content into sections.' }); }
          if (headings?.h2?.length > 0 && headings?.h1?.length === 0) { score -= 10; warns.push({ level: 'warning', text: 'Poor heading hierarchy — H2 tags exist but H1 is missing.' }); }

          const hScore = Math.max(0, score);
          const hColor = hScore >= 80 ? 'text-emerald-400' : hScore >= 60 ? 'text-amber-400' : 'text-rose-400';
          const hBorder = hScore >= 80 ? 'border-emerald-500/20' : hScore >= 60 ? 'border-amber-500/20' : 'border-rose-500/20';

          return (
            <div className="space-y-4">
              {/* Score badge */}
              <div className={`flex items-center gap-3 p-3 bg-blue-100 border ${hBorder} rounded-xl`}>
                <div className={`text-2xl font-black ${hColor}`}>{hScore}</div>
                <div>
                  <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">Heading Score</p>
                  <p className="text-[9px] text-blue-700 mt-0.5">Based on H1, H2, H3 structure and hierarchy</p>
                </div>
              </div>

              {/* Warnings */}
              {warns.map((w, i) => (
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl border text-[10px] ${w.level === 'critical' ? 'bg-rose-500/5 border-rose-500/15 text-rose-300' : 'bg-amber-500/5 border-amber-500/15 text-amber-300'}`}>
                  {w.level === 'critical' ? <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-400" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />}
                  <span>{w.text}</span>
                </div>
              ))}

              {/* Heading tree */}
              <div className="space-y-1.5">
                {headings?.h1?.length > 0 && headings.h1.map((h, i) => (
                  <div key={`h1-${i}`} className="flex items-start gap-2 p-2.5 bg-indigo-500/5 border border-indigo-500/15 rounded-lg">
                    <span className="shrink-0 text-[8px] font-black text-white bg-indigo-600 px-1.5 py-0.5 rounded">H1</span>
                    <span className="text-xs text-blue-600 font-semibold">{h}</span>
                  </div>
                ))}
                {headings?.h2?.length > 0 && headings.h2.slice(0, 8).map((h, i) => (
                  <div key={`h2-${i}`} className="flex items-start gap-2 p-2 bg-slate-800/20 border border-slate-800/40 rounded-lg ml-4">
                    <span className="shrink-0 text-[8px] font-black text-slate-300 bg-slate-700 px-1.5 py-0.5 rounded">H2</span>
                    <span className="text-xs text-slate-300">{h}</span>
                  </div>
                ))}
                {headings?.h2?.length > 8 && <p className="text-[9px] text-slate-500 italic ml-4">+{headings.h2.length - 8} more H2 headings</p>}
                {headings?.h3?.length > 0 && headings.h3.slice(0, 6).map((h, i) => (
                  <div key={`h3-${i}`} className="flex items-start gap-2 p-2 bg-slate-800/10 border border-slate-800/20 rounded-lg ml-8">
                    <span className="shrink-0 text-[8px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">H3</span>
                    <span className="text-xs text-slate-400">{h}</span>
                  </div>
                ))}
                {headings?.h3?.length > 6 && <p className="text-[9px] text-slate-500 italic ml-8">+{headings.h3.length - 6} more H3 headings</p>}
                {(!headings?.h1?.length && !headings?.h2?.length && !headings?.h3?.length) && (
                  <div className="p-4 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    No heading tags detected on this page.
                  </div>
                )}
              </div>

              {/* H count summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'H1 Count', count: headings?.h1?.length || 0, ideal: '= 1', ok: headings?.h1?.length === 1 },
                  { label: 'H2 Count', count: headings?.h2?.length || 0, ideal: '≥ 2', ok: (headings?.h2?.length || 0) >= 2 },
                  { label: 'H3 Count', count: headings?.h3?.length || 0, ideal: 'optional', ok: true },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-slate-800/30 border border-slate-700/40 rounded-xl text-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">{item.label}</p>
                    <p className={`text-xl font-black ${item.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{item.count}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Ideal: {item.ideal}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── SEO Issues Panel ──────────────────────────────────────────────── */}
      {(() => {
        const issues = [];
        if (!title?.text) issues.push({ icon: '❌', type: 'Missing Title Tag', rec: 'Add a unique, descriptive title tag (30–60 characters) to every page. This is the most important on-page SEO element.' });
        else if (title.text.length < 30) issues.push({ icon: '⚠', type: 'Title Too Short', rec: `Current: ${title.text.length} chars. Expand to at least 30 characters to better describe the page and target keywords.` });
        else if (title.text.length > 60) issues.push({ icon: '⚠', type: 'Title Too Long', rec: `Current: ${title.text.length} chars. Shorten to under 60 chars to avoid truncation in Google search results.` });
        if (!metaDescription?.text) issues.push({ icon: '❌', type: 'Missing Meta Description', rec: 'Add a compelling meta description (120–160 chars). It appears in SERPs and directly affects click-through rates.' });
        else if (metaDescription.text.length < 120) issues.push({ icon: '⚠', type: 'Meta Description Too Short', rec: `Current: ${metaDescription.text.length} chars. Aim for 120–160 characters to maximise SERP real estate.` });
        else if (metaDescription.text.length > 160) issues.push({ icon: '⚠', type: 'Meta Description Too Long', rec: `Current: ${metaDescription.text.length} chars. Trim to under 160 chars to prevent truncation in search results.` });
        if (headings?.h1?.length === 0) issues.push({ icon: '❌', type: 'Missing H1 Heading', rec: 'Every page must have exactly one H1 heading. It signals the main topic to search engines.' });
        if (headings?.h1?.length > 1) issues.push({ icon: '⚠', type: 'Multiple H1 Tags', rec: `Found ${headings.h1.length} H1 tags. Use only one H1 per page — use H2/H3 for sub-sections.` });
        if (headings?.h2?.length === 0) issues.push({ icon: '⚠', type: 'No H2 Tags', rec: 'Add H2 headings to structure your content into clear sections for both users and crawlers.' });
        const missingAlt = (imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0);
        if (missingAlt > 0) issues.push({ icon: '⚠', type: 'Missing Image ALT Text', rec: `${missingAlt} image${missingAlt > 1 ? 's' : ''} missing ALT attributes. ALT text improves accessibility and helps images rank in Google Images.` });
        if (links?.brokenCount > 0) issues.push({ icon: '❌', type: 'Broken Links', rec: `${links.brokenCount} broken link${links.brokenCount > 1 ? 's' : ''} detected. Fix or remove broken links — they hurt crawlability and user experience.` });
        if (!canonical?.text) issues.push({ icon: '⚠', type: 'Missing Canonical Tag', rec: 'Add a canonical URL to prevent duplicate content penalties when pages are accessible via multiple URLs.' });
        if (!robotsTxt?.exists) issues.push({ icon: '⚠', type: 'Missing robots.txt', rec: 'Create a robots.txt file to guide search engine crawlers and prevent indexing of unwanted pages.' });
        if (!sitemap?.exists) issues.push({ icon: '⚠', type: 'Missing sitemap.xml', rec: 'Submit a sitemap.xml to help search engines discover and index all your pages efficiently.' });
        if (!mobileFriendliness?.viewportConfigured) issues.push({ icon: '❌', type: 'Missing Viewport Meta Tag', rec: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile responsiveness.' });

        if (issues.length === 0) return null;
        return (
          <div className="glass-card p-6">
            <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
              <Sparkles className="text-indigo-400 h-5 w-5" />
              SEO Issues &amp; Recommendations
              <span className="ml-auto px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black">{issues.length} to fix</span>
            </h3>
            <div className="space-y-3">
              {issues.map((issue, idx) => (
                <div key={idx} className="p-4 bg-slate-800/20 border border-slate-700/40 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm">{issue.icon}</span>
                    <p className="text-xs font-extrabold text-slate-200">{issue.type}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed pl-6">{issue.rec}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showAltPanel && (
        <MissingAltPanel
          items={
            (crawlData?.siteWideImages?.missingAltImages?.length
              ? crawlData.siteWideImages.missingAltImages
              : imageAnalysis?.missingAltSrcs || [])
          }
          onClose={() => setShowAltPanel(false)}
        />
      )}
      {showBrokenPanel && (
        <BrokenLinksPanel
          links={links?.brokenLinks || []}
          onClose={() => setShowBrokenPanel(false)}
        />
      )}
      {activeWarning && (
        <SeoWarningPanel
          warning={activeWarning}
          onClose={() => setActiveWarning(null)}
        />
      )}

    </div>
  );
}
