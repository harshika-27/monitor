import { useState } from 'react';
import {
  XCircle, ExternalLink, Copy, CheckCircle2, AlertTriangle,
  AlertCircle, Image, Link2Off, FileText, Layers, Info
} from 'lucide-react';

// ── Copy to clipboard helper ──────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 px-2 py-1 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer transition-all"
      title="Copy URL"
    >
      {copied ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function ModalWrapper({ title, icon: Icon, iconColor = 'text-indigo-400', children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl w-full max-w-3xl my-6 overflow-hidden animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
          <h2 className="text-slate-200 font-extrabold text-base flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-all"
          >
            <XCircle className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        {/* Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Panel: Missing ALT Images ─────────────────────────────────────────────────
export function MissingAltPanel({ items = [], onClose }) {
  const [imgErrors, setImgErrors] = useState({});

  return (
    <ModalWrapper title={`Missing ALT Text — ${items.length} image${items.length !== 1 ? 's' : ''}`} icon={Image} iconColor="text-rose-400" onClose={onClose}>
      {items.length === 0 ? (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400 font-bold">All images have valid ALT text.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => {
            const src = typeof item === 'string' ? item : (item?.src || '');
            const suggested = typeof item === 'object' ? (item?.suggestedAlt || '') : '';
            const page = typeof item === 'object' ? (item?.foundOnPage || '') : '';
            const altStatus = typeof item === 'object' ? (item?.altStatus || 'missing') : 'missing';

            return (
              <div key={idx} className="p-4 bg-slate-800/20 border border-slate-800/50 rounded-xl space-y-3">
                {/* Preview + URL */}
                <div className="flex items-start gap-3">
                  {/* Image preview */}
                  <div className="shrink-0 h-16 w-16 rounded-lg overflow-hidden bg-slate-900/60 border border-slate-700 flex items-center justify-center">
                    {!imgErrors[idx] ? (
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={() => setImgErrors(prev => ({ ...prev, [idx]: true }))}
                      />
                    ) : (
                      <Image className="h-6 w-6 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Image URL */}
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Image URL</p>
                    <p className="font-mono text-xs text-indigo-400 break-all leading-relaxed">{src || '—'}</p>

                    {/* ALT status badge */}
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black border ${
                      altStatus === 'empty' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {altStatus === 'empty' ? 'EMPTY ALT' : 'MISSING ALT'}
                    </span>
                  </div>
                </div>

                {/* Page found on */}
                {page && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Found On Page</p>
                    <p className="font-mono text-xs text-slate-300 break-all">{page}</p>
                  </div>
                )}

                {/* Suggested ALT */}
                {suggested && (
                  <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
                    <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">💡 Suggested ALT Text</p>
                    <p className="text-xs text-emerald-300 italic">"{suggested}"</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-800/40">
                  {src && (
                    <a href={src} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all">
                      <ExternalLink className="h-3 w-3" /> Open Image
                    </a>
                  )}
                  {page && (
                    <a href={page} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all">
                      <ExternalLink className="h-3 w-3" /> Open Page
                    </a>
                  )}
                  {src && <CopyBtn text={src} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModalWrapper>
  );
}

// ── Panel: Broken Links ───────────────────────────────────────────────────────
export function BrokenLinksPanel({ links = [], onClose }) {
  const getSuggestedFix = (link) => {
    if (!link.url) return 'Check the URL for typos.';
    if (link.reason?.includes('404')) return 'Page not found. Update the link to the correct URL or remove it.';
    if (link.reason?.includes('DNS')) return 'Domain does not exist. Verify the domain name and remove if no longer active.';
    if (link.reason?.includes('500')) return 'Server error on the target page. Contact the website owner or use a cached version.';
    if (link.reason?.includes('Timeout')) return 'The target page took too long to respond. Retry later or replace the link.';
    if (link.type === 'internal') return 'Internal page missing. Create the missing page or update the link to an existing page.';
    return 'Verify the URL is correct. Consider replacing or removing this link.';
  };

  return (
    <ModalWrapper title={`Broken Links — ${links.length} found`} icon={Link2Off} iconColor="text-rose-400" onClose={onClose}>
      {links.length === 0 ? (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400 font-bold">No broken links detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {links.map((link, idx) => (
            <div key={idx} className="p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl space-y-3">
              {/* Broken URL */}
              <div>
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Broken URL</p>
                <p className="font-mono text-xs text-slate-300 break-all">{link.url || '—'}</p>
              </div>

              {/* Source page */}
              {link.sourcePage && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source Page</p>
                  <p className="font-mono text-xs text-slate-300 break-all">{link.sourcePage}</p>
                </div>
              )}

              {/* Status + type row */}
              <div className="flex items-center gap-3 flex-wrap">
                {link.statusCode && (
                  <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-black">
                    HTTP {link.statusCode}
                  </span>
                )}
                {link.type && (
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-xs font-bold capitalize">
                    {link.type}
                  </span>
                )}
                {link.reason && (
                  <span className="text-xs text-amber-400 font-bold">{link.reason}</span>
                )}
              </div>

              {/* Suggested fix */}
              <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/15 rounded-lg">
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">💡 Suggested Fix</p>
                <p className="text-xs text-slate-300 leading-relaxed">{getSuggestedFix(link)}</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-rose-500/10">
                {link.url && (
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all">
                    <ExternalLink className="h-3 w-3" /> Open Link
                  </a>
                )}
                {link.sourcePage && (
                  <a href={link.sourcePage} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all">
                    <ExternalLink className="h-3 w-3" /> Open Source Page
                  </a>
                )}
                {link.url && <CopyBtn text={link.url} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalWrapper>
  );
}

// ── Panel: Generic SEO Warning ────────────────────────────────────────────────
export function SeoWarningPanel({ warning, onClose }) {
  if (!warning) return null;

  const RECOMMENDATIONS = {
    'missing_meta_desc':   { title: 'Missing Meta Description',        icon: FileText,  color: 'text-rose-400',  rec: 'Add a compelling meta description (120–160 characters). It appears in search results and directly affects click-through rates.' },
    'short_meta_desc':     { title: 'Meta Description Too Short',      icon: FileText,  color: 'text-amber-400', rec: 'Your meta description is too short. Expand it to 120–160 characters to fill the full SERP snippet space.' },
    'long_meta_desc':      { title: 'Meta Description Too Long',       icon: FileText,  color: 'text-amber-400', rec: 'Shorten your meta description to under 160 characters. Google truncates longer descriptions in search results.' },
    'missing_title':       { title: 'Missing Page Title',              icon: FileText,  color: 'text-rose-400',  rec: 'Every page must have a unique <title> tag (30–60 characters). It is the most important SEO on-page element.' },
    'short_title':         { title: 'Title Too Short',                 icon: FileText,  color: 'text-amber-400', rec: 'Your title is too short. Expand it to 30–60 characters to include primary keywords and improve CTR.' },
    'long_title':          { title: 'Title Too Long',                  icon: FileText,  color: 'text-amber-400', rec: 'Shorten your title to under 60 characters to avoid truncation in Google search results.' },
    'missing_h1':          { title: 'Missing H1 Heading',              icon: Layers,    color: 'text-rose-400',  rec: 'Add exactly one H1 heading to this page. The H1 is the primary topic signal for search engines and users.' },
    'multiple_h1':         { title: 'Multiple H1 Tags',                icon: Layers,    color: 'text-amber-400', rec: 'Use only one H1 per page. Multiple H1 tags dilute topic focus and confuse search engine crawlers.' },
    'missing_h2':          { title: 'No H2 Tags Found',                icon: Layers,    color: 'text-amber-400', rec: 'Add H2 headings to structure your content into sections. They improve readability and keyword distribution.' },
    'heading_hierarchy':   { title: 'Poor Heading Hierarchy',          icon: Layers,    color: 'text-amber-400', rec: 'Ensure headings follow a logical order: H1 → H2 → H3. Skipping levels confuses both users and crawlers.' },
    'missing_alt':         { title: 'Missing Image ALT Text',          icon: Image,     color: 'text-amber-400', rec: 'Add descriptive ALT attributes to all images. ALT text improves accessibility (WCAG 2.1) and image SEO.' },
    'broken_links':        { title: 'Broken Links Detected',           icon: Link2Off,  color: 'text-rose-400',  rec: 'Fix or remove broken links. They damage user experience, waste crawl budget, and can hurt search rankings.' },
  };

  const info = RECOMMENDATIONS[warning.type] || {
    title: warning.label || 'SEO Issue',
    icon: AlertTriangle,
    color: 'text-amber-400',
    rec: warning.recommendation || 'Review and fix this SEO issue to improve your search ranking.'
  };

  const IconComp = info.icon;

  return (
    <ModalWrapper title={info.title} icon={IconComp} iconColor={info.color} onClose={onClose}>
      {/* Summary */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
        info.color.includes('rose') ? 'bg-rose-500/5 border-rose-500/15' : 'bg-amber-500/5 border-amber-500/15'
      }`}>
        <IconComp className={`h-5 w-5 shrink-0 mt-0.5 ${info.color}`} />
        <div>
          <p className={`text-sm font-extrabold ${info.color}`}>{info.title}</p>
          {warning.value && (
            <p className="text-xs text-slate-400 mt-0.5">Current value: <span className="font-bold text-slate-300">{warning.value}</span></p>
          )}
          {warning.pageUrl && (
            <p className="text-xs text-slate-500 font-mono mt-0.5">{warning.pageUrl}</p>
          )}
        </div>
      </div>

      {/* Recommendation */}
      <div className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">💡 Recommendation</p>
        <p className="text-sm text-slate-300 leading-relaxed">{info.rec}</p>
      </div>

      {/* Extra context if provided */}
      {warning.items && warning.items.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Details</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {warning.items.map((item, i) => (
              <div key={i} className="p-2.5 bg-slate-800/20 border border-slate-800/40 rounded-lg text-xs text-slate-300 font-mono break-all">
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </ModalWrapper>
  );
}
