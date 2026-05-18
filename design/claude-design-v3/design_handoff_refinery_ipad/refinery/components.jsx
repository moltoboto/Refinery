/* global React, Icon */
const { useState, useEffect, useRef } = React;

// ---------- Topbar with chip system ----------
function Topbar({ tweaks, setTweak, view, setView }) {
  const chips = [
    { id: "unread",  icon: "unread",   label: "Unread",   active: tweaks.unreadOnly,           onClick: () => setTweak('unreadOnly', !tweaks.unreadOnly) },
    { id: "nav",     icon: "nav",      label: "Nav",      active: tweaks.rail !== 'hidden',     onClick: () => setTweak('rail', tweaks.rail === 'hidden' ? 'full' : 'hidden') },
    { id: "rail",    icon: "rail",     label: "Icons",    active: tweaks.rail === 'icons',      onClick: () => setTweak('rail', tweaks.rail === 'icons' ? 'full' : 'icons'), title: "Collapse nav to icons" },
    { id: "reading", icon: "reading",  label: "Reading",  active: tweaks.focus !== 'list',      onClick: () => setTweak('focus', tweaks.focus === 'list' ? 'normal' : 'list'),     title: "Hide reading pane" },
    { id: "list",    icon: "hideList", label: "Focus",    active: tweaks.focus === 'reading',   onClick: () => setTweak('focus', tweaks.focus === 'reading' ? 'normal' : 'reading'), title: "Hide list pane" },
    { divider: true },
    { id: "density", icon: "compact",  label: "Compact",  active: tweaks.density === 'compact', onClick: () => setTweak('density', tweaks.density === 'compact' ? 'comfortable' : 'compact') },
    { id: "aaa",     icon: "aaa",      label: "Aa",       active: tweaks.fontSize === 'large',  onClick: () => setTweak('fontSize', tweaks.fontSize === 'large' ? 'regular' : 'large'), title: "Larger reading type" },
    { id: "refresh", icon: "refresh",  label: "Refresh",  active: false,                        onClick: () => {} },
  ];

  return (
    <header className="topbar">
      <div className="brand-cell">
        <span className="brand-mark" />
        <div className="brand-text">
          <span className="brand-name">Refinery</span>
          <span className="brand-sub">v3.0 · iPad</span>
        </div>
      </div>
      <div className="tb-right">
        <div className="tb-stat">
          <span className="tb-stat-dot" />
          <span className="num">3,022</span>
          <span>total</span>
        </div>
        <div className="tb-search">
          <Icon name="search" size={14} />
          <input placeholder="Search articles, sources, kept items…" />
          <span className="key">⌘K</span>
        </div>
        <div className="tb-chips">
          {chips.map((c, i) => c.divider ? (
            <span key={"d"+i} className="tb-divider" />
          ) : (
            <button key={c.id} className="chip" aria-pressed={c.active} onClick={c.onClick} title={c.title || c.label}>
              <Icon name={c.icon} size={14} />
              <span className="chip-label">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// ---------- Nav rail ----------
function Rail({ data, current, setCurrent }) {
  return (
    <aside className="rail">
      <nav className="rail-sect">
        <div className="rail-label"><span>Inbox</span></div>
        {data.inbox.map(it => (
          <button key={it.id} className="rail-item" aria-current={current === it.id} onClick={() => setCurrent(it.id)} title={it.label}>
            <span className="rail-ico"><Icon name={it.icon} size={17} /></span>
            <span className="rail-label-text">{it.label}</span>
            <span className={"rail-count" + (it.hot ? " hot" : "")}>{it.count.toLocaleString()}</span>
          </button>
        ))}
      </nav>
      <nav className="rail-sect">
        <div className="rail-label"><span>Categories</span><button className="rail-add" title="Add category"><Icon name="plus" size={11}/></button></div>
        {data.categories.map(c => (
          <button key={c.id} className="rail-item" aria-current={current === c.id} onClick={() => setCurrent(c.id)} title={c.label}>
            <span className="rail-ico"><Icon name={c.icon} size={18} /></span>
            <span className="rail-label-text">{c.label}</span>
            <span className={"rail-count" + (c.hot ? " hot" : "")}>{c.count || "—"}</span>
          </button>
        ))}
      </nav>
      <nav className="rail-sect">
        <div className="rail-label"><span>Sources</span><button className="rail-add" title="Add source"><Icon name="plus" size={11}/></button></div>
        {data.sources.map(s => (
          <button key={s.id} className="rail-source" title={s.url}>
            <span className={"rail-fav " + s.color}>{s.fav}</span>
            <span className="rail-source-url">{s.url}</span>
            <span className="rail-count">{s.count}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

// ---------- List column ----------
function ListColumn({ data, selectedId, setSelectedId, tweaks }) {
  const items = tweaks.unreadOnly ? data.articles.filter(a => a.unread) : data.articles;
  return (
    <section className="list">
      <div className="list-head">
        <div>
          <h2 className="list-title">All Unread</h2>
          <div className="list-meta"><span className="ink">{items.length}</span> shown · <span className="hot">3,022 total</span></div>
        </div>
        <div className="list-actions">
          <button className="list-action" title="Summarize"><Icon name="summarize" size={13}/><span>Summarize</span></button>
          <button className="list-action" title="Mark all read"><Icon name="markRead" size={13}/></button>
          <button className="list-action" title="Filter"><Icon name="filter" size={13}/></button>
        </div>
      </div>
      <div className="list-scroll">
        {items.map(a => (
          <ListRow key={a.id} a={a} selected={a.id === selectedId} onClick={() => setSelectedId(a.id)} showHero={tweaks.imagery} />
        ))}
      </div>
    </section>
  );
}

function ListRow({ a, selected, onClick, showHero }) {
  return (
    <article className={"row" + (a.unread ? "" : " read")} aria-current={selected} onClick={onClick}>
      {a.unread && <span className="row-unread" />}
      <div className="row-meta">
        <span className={"row-fav " + a.sourceColor}>{a.sourceFav}</span>
        <span className="row-source">{a.source}</span>
        <span className="row-dot" />
        <span>{a.category}</span>
        {a.tag && <span className="row-tag">{a.tag}</span>}
        <span className="row-time">{a.time}</span>
      </div>
      <h3 className="row-title">{a.title}</h3>
      {a.snippet && <p className="row-snippet">{a.snippet}</p>}
      {showHero && a.hero && <div className="row-hero" />}
      {a.progress > 0 && a.progress < 100 && (
        <div className="row-foot">
          <div className="row-progress" style={{ "--p": a.progress + "%" }} />
          <span>{a.progress}% · 4 min left</span>
        </div>
      )}
    </article>
  );
}

// ---------- Article ----------
function Article({ a, body, tweaks }) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(a.progress || 0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      setProgress(Math.min(100, Math.round((el.scrollTop / max) * 100)));
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [a && a.id]);

  if (!a) return <ArticleEmpty />;

  const bodyFs = tweaks.fontSize === 'large' ? 19.5 : 17.5;

  return (
    <div className="article" ref={ref}>
      <div className="article-toolbar">
        <button className="atb-btn"><Icon name="back" size={13}/></button>
        <button className="atb-btn"><Icon name="fwd" size={13}/></button>
        <span style={{width: 10}}/>
        <button className="atb-btn primary"><Icon name="bookmarkFill" size={13}/><span>Keep</span></button>
        <button className="atb-btn"><Icon name="check" size={13}/><span>Mark read</span></button>
        <button className="atb-btn"><Icon name="share" size={13}/></button>
        <button className="atb-btn"><Icon name="ext" size={13}/><span>Open original</span></button>
        <span className="atb-spacer"/>
        <button className="atb-btn"><Icon name="more" size={13}/></button>
      </div>
      <div className="article-progress" style={{ "--p": progress + "%" }} />
      <div className="article-inner">
        <div className="article-kicker">
          <span className="source">{a.source}</span>
          <span className="sep" />
          <span>{a.category}</span>
          {a.tag && <span className="tag">{a.tag}</span>}
          <span className="sep" />
          <span>May 18 · 2026</span>
        </div>
        <h1 className="article-title">{a.title}</h1>
        {a.deck && <p className="article-deck">{a.deck}</p>}
        <div className="article-byline">
          <span className="byline-avatar">EM</span>
          <span>By Elena Moss · senior writer</span>
          <span className="byline-time">7 MIN READ</span>
        </div>
        <div className="article-hero">
          <span className="hero-cap">Hero · publisher image</span>
        </div>
        <div className="article-body" style={{fontSize: bodyFs}}>
          {body.map((p, i) => <p key={i}>{p}</p>)}
          <h2>Why this keeps happening</h2>
          <blockquote>The review process was designed for a slower velocity than what the project now operates at, and the cracks are showing.</blockquote>
          <p>{body[0]}</p>
        </div>
      </div>
    </div>
  );
}

function ArticleEmpty() {
  return (
    <div className="article-empty">
      <div className="article-empty-inner">
        <div className="article-empty-mark"><Icon name="sparkle" size={24} /></div>
        <h3>Inbox at rest</h3>
        <p>Pick an item from the list, or press <kbd>J</kbd> to step through unread. <kbd>S</kbd> summarizes the queue in one paragraph.</p>
        <div className="article-empty-keys">
          <span><kbd>J</kbd> next</span>
          <span><kbd>K</kbd> keep</span>
          <span><kbd>M</kbd> read</span>
          <span><kbd>/</kbd> search</span>
          <span><kbd>F</kbd> focus mode</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Kept view ----------
function KeptView({ data }) {
  const kept = data.articles.filter(a => a.kept);
  const [filter, setFilter] = useState('all');
  const filters = ['all','unread','reading','finished','this month'];
  return (
    <div className="kept" style={{ gridColumn: '2 / span 2' }}>
      <div className="kept-head">
        <div>
          <h1>Kept</h1>
          <p>{kept.length} items · 3 in progress · 8 unread</p>
        </div>
        <div className="kept-filter">
          {filters.map(f => (
            <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>
      <div className="kept-grid">
        {kept.map(a => (
          <article key={a.id} className="kept-card">
            <div className="kept-card-tag">
              <span className={"fav " + a.sourceColor}>{a.sourceFav}</span>
              <span>{a.source}</span>
              <span>·</span>
              <span>{a.category}</span>
            </div>
            <h3>{a.title}</h3>
            <p>{a.deck || a.snippet}</p>
            <div className="kept-card-foot">
              <span>{a.time}</span>
              <div className="kept-card-progress" style={{ "--p": (a.progress || 0) + "%" }} />
              <span>{a.progress > 0 ? `${a.progress}%` : "—"}</span>
            </div>
          </article>
        ))}
        {Array.from({length: 3}).map((_, i) => (
          <article key={"x"+i} className="kept-card" style={{opacity: 0.5}}>
            <div className="kept-card-tag"><span className="fav c2">—</span><span>—</span></div>
            <h3 style={{color: "var(--ink-6)"}}>{["A field guide to small ledgers","On reading slowly in 2026","The notebook problem"][i]}</h3>
            <p style={{color:"var(--ink-6)"}}>Saved last week. No progress yet.</p>
            <div className="kept-card-foot"><span>—</span><div className="kept-card-progress" /><span>—</span></div>
          </article>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Topbar, Rail, ListColumn, Article, ArticleEmpty, KeptView });
