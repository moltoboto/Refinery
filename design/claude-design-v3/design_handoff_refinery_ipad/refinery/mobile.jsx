/* global React, Icon */
const { useState } = React;

function PhoneFrame({ children, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 354, height: 720,
        borderRadius: 42,
        background: 'var(--ink-9)',
        padding: 8,
        boxShadow: '0 25px 60px -25px rgba(50,30,15,0.35), 0 2px 0 rgba(20,18,15,0.04)',
        position: 'relative',
      }}>
        <div style={{
          width: '100%', height: '100%',
          borderRadius: 34, overflow: 'hidden',
          background: 'var(--paper)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 28, padding: '8px 22px',
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--ff-mono)', fontSize: 10.5,
            color: 'var(--ink-9)', letterSpacing: '0.04em',
            zIndex: 5, pointerEvents: 'none',
          }}>
            <span style={{fontWeight: 600}}>9:41</span>
            <span style={{display:'flex',gap:4,alignItems:'center'}}>
              <span style={{width:16,height:9,border:'1px solid var(--ink-9)',borderRadius:2,position:'relative'}}>
                <span style={{position:'absolute',inset:1,background:'var(--ink-9)',width:10,borderRadius:1}} />
              </span>
            </span>
          </div>
          <div style={{ height: '100%', paddingTop: 28 }}>
            {children}
          </div>
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--ff-mono)', fontSize: 10.5,
        color: 'var(--ink-6)', letterSpacing: '0.12em',
        textTransform: 'uppercase'
      }}>{label}</div>
    </div>
  );
}

// Pattern A: Stacked drill-down
function MobileStacked({ data, level, setLevel, selectedId, setSelectedId }) {
  if (level === 'feeds') {
    return (
      <div className="mobile m-stack" style={{ height: '100%' }}>
        <div className="m-top">
          <span style={{width:30}} />
          <div>
            <div className="m-top-title">Refinery</div>
            <div className="m-top-sub">3,022 unread</div>
          </div>
          <button className="m-top-action"><Icon name="search" size={16}/></button>
        </div>
        <div className="m-scroll">
          <div style={{padding:'16px 16px 6px',fontFamily:'var(--ff-mono)',fontSize:10,letterSpacing:'0.14em',color:'var(--ink-5)',textTransform:'uppercase'}}>Inbox</div>
          {data.inbox.map(it => (
            <button key={it.id} className="m-feed-row" aria-current={it.id === 'i-unread'} onClick={() => setLevel('list')}>
              <span className="ico"><Icon name={it.icon} size={16}/></span>
              <span className="name">{it.label}</span>
              <span className={"count" + (it.hot ? " hot" : "")}>{it.count.toLocaleString()}</span>
            </button>
          ))}
          <div style={{padding:'18px 16px 6px',fontFamily:'var(--ff-mono)',fontSize:10,letterSpacing:'0.14em',color:'var(--ink-5)',textTransform:'uppercase'}}>Categories</div>
          {data.categories.slice(0,7).map(c => (
            <button key={c.id} className="m-feed-row">
              <span className="ico"><Icon name={c.icon} size={16}/></span>
              <span className="name">{c.label}</span>
              <span className={"count" + (c.hot ? " hot" : "")}>{c.count || "—"}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (level === 'list') {
    return (
      <div className="mobile m-stack" style={{height:'100%'}}>
        <div className="m-top">
          <button className="m-top-back" onClick={() => setLevel('feeds')}><Icon name="back" size={16}/></button>
          <div>
            <div className="m-top-title">All Unread</div>
            <div className="m-top-sub">3,022 · 9 shown</div>
          </div>
          <button className="m-top-action"><Icon name="more" size={16}/></button>
        </div>
        <div className="m-scroll">
          {data.articles.map(a => (
            <article key={a.id} className={"m-row" + (a.unread ? " unread" : "")} onClick={() => { setSelectedId(a.id); setLevel('article'); }}>
              <div>
                <div className="m-row-meta">
                  <span className={"row-fav " + a.sourceColor} style={{width:12,height:12,fontSize:8}}>{a.sourceFav}</span>
                  <span className="src">{a.source}</span><span>·</span><span>{a.time}</span>
                </div>
                <h3 className="m-row-title">{a.title}</h3>
                <p className="m-row-snip">{a.snippet}</p>
              </div>
              {a.hero && <div className="m-row-thumb" />}
            </article>
          ))}
        </div>
      </div>
    );
  }
  const a = data.articles.find(x => x.id === selectedId) || data.articles[0];
  return (
    <div className="mobile m-stack" style={{height:'100%'}}>
      <div className="m-top">
        <button className="m-top-back" onClick={() => setLevel('list')}><Icon name="back" size={16}/></button>
        <div><div className="m-top-sub" style={{textTransform:'uppercase'}}>{a.source}</div></div>
        <button className="m-top-action"><Icon name="more" size={16}/></button>
      </div>
      <div className="m-article">
        <div className="article-kicker"><span className="source">{a.category}</span><span className="sep"/><span>{a.time}</span></div>
        <h1 className="article-title">{a.title}</h1>
        {a.deck && <p className="article-deck">{a.deck}</p>}
        <div className="article-hero"><span className="hero-cap">Hero</span></div>
        <div className="article-body">
          <p>{a.snippet}</p>
          <p>Two days earlier, the kernel had absorbed a similar but distinct bug in the same module.</p>
        </div>
      </div>
    </div>
  );
}

// Pattern B: Bottom tabs
function MobileTabs({ data }) {
  const [tab, setTab] = useState('inbox');
  return (
    <div className="mobile" style={{ height: '100%', gridTemplateRows: 'auto 1fr auto' }}>
      <div className="m-top">
        <span style={{width:30}} />
        <div>
          <div className="m-top-title">{tab === 'inbox' ? 'All Unread' : tab === 'feeds' ? 'Categories' : tab === 'saved' ? 'Kept' : 'Profile'}</div>
          <div className="m-top-sub">{tab === 'inbox' ? '3,022 unread' : tab === 'saved' ? '21 kept · 3 reading' : ''}</div>
        </div>
        <button className="m-top-action"><Icon name="search" size={16}/></button>
      </div>
      <div className="m-scroll">
        {tab === 'inbox' && data.articles.slice(0,6).map(a => (
          <article key={a.id} className={"m-row" + (a.unread ? " unread" : "")}>
            <div>
              <div className="m-row-meta">
                <span className={"row-fav " + a.sourceColor} style={{width:12,height:12,fontSize:8}}>{a.sourceFav}</span>
                <span className="src">{a.source}</span><span>·</span><span>{a.time}</span>
              </div>
              <h3 className="m-row-title">{a.title}</h3>
              <p className="m-row-snip">{a.snippet}</p>
            </div>
            {a.hero && <div className="m-row-thumb" />}
          </article>
        ))}
        {tab === 'feeds' && (
          <div>
            {data.categories.slice(0,8).map(c => (
              <button key={c.id} className="m-feed-row">
                <span className="ico"><Icon name={c.icon} size={16}/></span>
                <span className="name">{c.label}</span>
                <span className={"count"+(c.hot?" hot":"")}>{c.count || "—"}</span>
              </button>
            ))}
          </div>
        )}
        {tab === 'saved' && (
          <div style={{padding: '14px 16px'}}>
            {data.articles.filter(a => a.kept).map(a => (
              <article key={a.id} style={{padding:'12px 0',borderBottom:'1px solid var(--rule-soft)'}}>
                <div className="m-row-meta">
                  <span className={"row-fav " + a.sourceColor} style={{width:12,height:12,fontSize:8}}>{a.sourceFav}</span>
                  <span className="src">{a.source}</span><span>·</span><span>{a.progress > 0 ? a.progress + '% read' : 'Saved'}</span>
                </div>
                <h3 className="m-row-title">{a.title}</h3>
                {a.progress > 0 && <div style={{height:2,background:'var(--paper-3)',borderRadius:2,marginTop:8,position:'relative',overflow:'hidden'}}><div style={{position:'absolute',inset:0,width:a.progress+'%',background:'var(--accent)'}}/></div>}
              </article>
            ))}
          </div>
        )}
        {tab === 'me' && (
          <div style={{padding:'40px 22px',textAlign:'center'}}>
            <div style={{width:60,height:60,borderRadius:'50%',background:'var(--accent-soft)',margin:'0 auto 16px',display:'grid',placeItems:'center',color:'var(--accent-deep)',fontFamily:'var(--ff-display)',fontSize:22,fontWeight:500}}>R</div>
            <div style={{fontFamily:'var(--ff-display)',fontSize:22,fontWeight:500}}>Reader</div>
            <div style={{fontFamily:'var(--ff-mono)',fontSize:10.5,color:'var(--ink-6)',letterSpacing:'0.08em',textTransform:'uppercase',marginTop:4}}>3,565 articles · 21 kept</div>
          </div>
        )}
      </div>
      <div className="m-tabs">
        <button className="m-tab" aria-current={tab==='inbox'} onClick={()=>setTab('inbox')}><Icon name="tab-inbox" size={20}/><span>Inbox</span></button>
        <button className="m-tab" aria-current={tab==='feeds'} onClick={()=>setTab('feeds')}><Icon name="tab-feeds" size={20}/><span>Feeds</span></button>
        <button className="m-tab" aria-current={tab==='saved'} onClick={()=>setTab('saved')}><Icon name="tab-saved" size={20}/><span>Kept</span></button>
        <button className="m-tab" aria-current={tab==='me'} onClick={()=>setTab('me')}><Icon name="tab-me" size={20}/><span>Me</span></button>
      </div>
    </div>
  );
}

// Pattern C: Swipeable horizontal pages
function MobileSwipe({ data }) {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(data.articles[0].id);
  const a = data.articles.find(x => x.id === selectedId);
  return (
    <div className="mobile" style={{ height: '100%', gridTemplateRows: 'auto auto 1fr' }}>
      <div className="m-top">
        <span style={{width:30}} />
        <div>
          <div className="m-top-title">{['Feeds','All Unread','Article'][page]}</div>
          <div className="m-top-sub">{['Library','3,022 unread','7 min read'][page]}</div>
        </div>
        <button className="m-top-action"><Icon name="more" size={16}/></button>
      </div>
      <div className="m-swipe-dots">
        <span className={page===0?'active':''} onClick={()=>setPage(0)} />
        <span className={page===1?'active':''} onClick={()=>setPage(1)} />
        <span className={page===2?'active':''} onClick={()=>setPage(2)} />
      </div>
      <div style={{overflow:'hidden',position:'relative'}}>
        <div style={{display:'flex',width:'300%',height:'100%',transform:`translateX(-${page*33.3333}%)`,transition:'transform .3s ease'}}>
          <div style={{flex:'0 0 33.3333%',overflowY:'auto'}}>
            {data.categories.slice(0,7).map(c => (
              <button key={c.id} className="m-feed-row" onClick={()=>setPage(1)}>
                <span className="ico"><Icon name={c.icon} size={16}/></span>
                <span className="name">{c.label}</span>
                <span className={"count"+(c.hot?" hot":"")}>{c.count || "—"}</span>
              </button>
            ))}
          </div>
          <div style={{flex:'0 0 33.3333%',overflowY:'auto'}}>
            {data.articles.slice(0,6).map(x => (
              <article key={x.id} className={"m-row"+(x.unread?" unread":"")} onClick={()=>{setSelectedId(x.id);setPage(2);}}>
                <div>
                  <div className="m-row-meta"><span className={"row-fav " + x.sourceColor} style={{width:12,height:12,fontSize:8}}>{x.sourceFav}</span><span className="src">{x.source}</span><span>·</span><span>{x.time}</span></div>
                  <h3 className="m-row-title">{x.title}</h3>
                </div>
                {x.hero && <div className="m-row-thumb" />}
              </article>
            ))}
          </div>
          <div style={{flex:'0 0 33.3333%',overflowY:'auto'}}>
            <div className="m-article">
              <div className="article-kicker"><span className="source">{a.category}</span><span className="sep"/><span>{a.time}</span></div>
              <h1 className="article-title">{a.title}</h1>
              {a.deck && <p className="article-deck">{a.deck}</p>}
              <div className="article-hero"><span className="hero-cap">Hero</span></div>
              <div className="article-body"><p>{a.snippet}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon-set comparison artboard
function IconSetView() {
  const headerSpecs = [
    { id: 'unread',  label: 'Unread filter',   monoline: 'unread',   alt: 'filter',  alt2: 'check' },
    { id: 'nav',     label: 'Nav toggle',      monoline: 'nav',      alt: 'rail',    alt2: 'hideList' },
    { id: 'rail',    label: 'Iconize nav',     monoline: 'rail',     alt: 'compact', alt2: 'nav' },
    { id: 'reading', label: 'Reading toggle',  monoline: 'reading',  alt: 'hideList',alt2: 'check' },
    { id: 'list',    label: 'Hide list',       monoline: 'hideList', alt: 'reading', alt2: 'compact' },
    { id: 'compact', label: 'Density',         monoline: 'compact',  alt: 'comfy',   alt2: 'filter' },
    { id: 'font',    label: 'Font size',       monoline: 'aaa',      alt: 'spark',   alt2: 'sparkle' },
    { id: 'refresh', label: 'Refresh',         monoline: 'refresh',  alt: 'spark',   alt2: 'sparkle' },
  ];
  return (
    <div className="iconset" style={{gridColumn:'2 / span 2'}}>
      <h1>Icon set, recommended</h1>
      <p className="lede">Custom monoline SVGs at 14–18px. Stroke 1.5, rounded joins — sympathetic to Lora's pen weight without trying to match it. All shapes survive at icon-only mode (no labels). Below: each chip shown with label, icon-only, and active state.</p>

      <h2>Header chips · the recommended set</h2>
      {headerSpecs.map(spec => (
        <div className="icon-row" key={spec.id}>
          <div className="icon-row-label">{spec.label}</div>
          <div className="icon-row-chips">
            <button className="chip"><Icon name={spec.monoline} size={14}/><span className="chip-label">With label</span></button>
            <button className="chip chip-icon" title={spec.label}><Icon name={spec.monoline} size={14}/></button>
            <button className="chip" aria-pressed="true"><Icon name={spec.monoline} size={14}/><span className="chip-label">Active</span></button>
            <span style={{width:8}}/>
            <button className="chip" style={{opacity:0.6}}><Icon name={spec.alt} size={14}/><span className="chip-label">alt A</span></button>
            <button className="chip" style={{opacity:0.6}}><Icon name={spec.alt2} size={14}/><span className="chip-label">alt B</span></button>
          </div>
        </div>
      ))}

      <h2>Nav rail · category glyphs</h2>
      <p style={{color:'var(--ink-7)',fontSize:13,maxWidth:620,marginBottom:18}}>Each glyph reads at 18px (full mode) and 32px (icon-only mode). Held to a consistent visual weight so the rail feels uniform; specifics (newspaper masthead, AI nodes, clock-watch lugs) keep them distinct.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,maxWidth:740}}>
        {window.REFINERY_DATA.categories.map(c => (
          <div key={c.id} style={{
            border:'var(--hairline)',borderRadius:10,padding:'14px 12px',
            background:'var(--paper-edge)',display:'flex',flexDirection:'column',
            alignItems:'center',gap:8,
          }}>
            <div style={{
              width:48,height:48,borderRadius:10,background:'var(--paper-2)',
              display:'grid',placeItems:'center',color:'var(--ink-8)'
            }}><Icon name={c.icon} size={22}/></div>
            <div style={{fontFamily:'var(--ff-ui)',fontSize:12,color:'var(--ink-9)',fontWeight:500}}>{c.label}</div>
            <div style={{fontFamily:'var(--ff-mono)',fontSize:9.5,color:'var(--ink-5)',letterSpacing:'0.08em',textTransform:'uppercase'}}>{c.count || "0"} items</div>
          </div>
        ))}
      </div>

      <h2>Active-state options</h2>
      <p style={{color:'var(--ink-7)',fontSize:13,maxWidth:620,marginBottom:14}}>Three candidate treatments for an active chip. Recommendation: <strong>solid ink fill</strong> with the icon picked out in orange — the highest-contrast option, survives iPad pinch-zoom, distinguishable from hover.</p>
      <div style={{display:'flex',gap:10,marginBottom:6,flexWrap:'wrap'}}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <button className="chip" aria-pressed="true"><Icon name="reading" size={14}/><span className="chip-label">Reading</span></button>
          <span style={{fontFamily:'var(--ff-mono)',fontSize:9.5,color:'var(--ink-6)',letterSpacing:'0.08em',textTransform:'uppercase',textAlign:'center'}}>Solid · recommended</span>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <button className="chip" style={{background:'var(--accent-soft)',borderColor:'var(--accent)',color:'var(--accent-deep)'}}><Icon name="reading" size={14}/><span className="chip-label">Reading</span></button>
          <span style={{fontFamily:'var(--ff-mono)',fontSize:9.5,color:'var(--ink-6)',letterSpacing:'0.08em',textTransform:'uppercase',textAlign:'center'}}>Tinted</span>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <button className="chip" style={{background:'transparent',borderColor:'var(--accent)',color:'var(--accent-deep)'}}><Icon name="reading" size={14}/><span className="chip-label">Reading</span></button>
          <span style={{fontFamily:'var(--ff-mono)',fontSize:9.5,color:'var(--ink-6)',letterSpacing:'0.08em',textTransform:'uppercase',textAlign:'center'}}>Outlined</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PhoneFrame, MobileStacked, MobileTabs, MobileSwipe, IconSetView });
