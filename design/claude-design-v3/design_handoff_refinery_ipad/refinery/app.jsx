/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSelect */
const { useState, useEffect } = React;

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "density": "comfortable",
  "imagery": true,
  "unreadOnly": false,
  "view": "desktop",
  "mobilePattern": "tabs",
  "rail": "full",
  "focus": "normal",
  "chips": "labeled",
  "fontSize": "regular"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(DEFAULT_TWEAKS);
  const data = window.REFINERY_DATA;
  const [selectedId, setSelectedId] = useState("a1");
  const [current, setCurrent] = useState("i-unread");
  const [mLevel, setMLevel] = useState("list");
  const [view, setView] = useState("inbox"); // inbox | kept | iconset

  const selected = data.articles.find(a => a.id === selectedId);

  useEffect(() => {
    const r = document.documentElement;
    r.dataset.theme = t.theme;
    r.dataset.density = t.density;
    r.dataset.rail = t.rail;
    r.dataset.focus = t.focus;
    r.dataset.chips = t.chips;
  }, [t.theme, t.density, t.rail, t.focus, t.chips]);

  return (
    <>
      <Tweaks t={t} setTweak={setTweak} view={view} setView={setView} />
      {t.view === 'desktop' && (
        <DesktopView t={t} setTweak={setTweak} data={data} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId} current={current} setCurrent={setCurrent} view={view} setView={setView} />
      )}
      {t.view === 'mobile' && (
        <MobileView t={t} data={data} selectedId={selectedId} setSelectedId={setSelectedId} mLevel={mLevel} setMLevel={setMLevel} />
      )}
    </>
  );
}

function DesktopView({ t, setTweak, data, selected, selectedId, setSelectedId, current, setCurrent, view, setView }) {
  return (
    <div className="app" data-screen-label="01 Desktop · iPad reader">
      <Topbar tweaks={t} setTweak={setTweak} view={view} setView={setView} />
      <div className="body">
        {t.rail !== 'hidden' && <Rail data={data} current={current} setCurrent={setCurrent} />}
        {view === 'kept' ? (
          <KeptView data={data} />
        ) : view === 'iconset' ? (
          <IconSetView />
        ) : (
          <>
            <ListColumn data={data} selectedId={selectedId} setSelectedId={setSelectedId} tweaks={t} />
            {selected ? <Article a={selected} body={data.articleBody} tweaks={t} /> : <ArticleEmpty />}
          </>
        )}
      </div>
      <footer className="foot">
        <span><kbd>J</kbd>Next</span>
        <span><kbd>K</kbd>Keep</span>
        <span><kbd>↵</kbd>Open</span>
        <span><kbd>M</kbd>Mark read</span>
        <span><kbd>S</kbd>Summarize</span>
        <span><kbd>F</kbd>Focus mode</span>
        <span className="foot-spacer" />
        <span><span className="accent">●</span> Synced 2 min ago · 3,022 unread</span>
      </footer>
    </div>
  );
}

function MobileView({ t, data, selectedId, setSelectedId, mLevel, setMLevel }) {
  return (
    <div data-screen-label="02 Mobile · Reader" style={{
      height: '100%', overflow: 'auto',
      background: 'var(--paper-2)',
      padding: '40px 24px 80px',
    }}>
      <div style={{maxWidth: 1300, margin: '0 auto'}}>
        <div style={{
          fontFamily: 'var(--ff-display)', fontSize: 30, color: 'var(--ink-9)',
          letterSpacing: '-0.018em', marginBottom: 4, fontWeight: 500,
        }}>Mobile patterns</div>
        <div style={{
          fontFamily:'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-6)',
          letterSpacing: '0.08em', textTransform:'uppercase',
          marginBottom: 32,
        }}>Three options for collapsing the iPad layout to phone. Choose from Tweaks → Mobile.</div>
        <div style={{
          display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {(t.mobilePattern === 'all' || t.mobilePattern === 'stacked') && (
            <PhoneFrame label="A · Stacked drill-down">
              <MobileStacked data={data} level={mLevel} setLevel={setMLevel} selectedId={selectedId} setSelectedId={setSelectedId} />
            </PhoneFrame>
          )}
          {(t.mobilePattern === 'all' || t.mobilePattern === 'tabs') && (
            <PhoneFrame label="B · Bottom tab bar">
              <MobileTabs data={data} />
            </PhoneFrame>
          )}
          {(t.mobilePattern === 'all' || t.mobilePattern === 'swipe') && (
            <PhoneFrame label="C · Swipeable pages">
              <MobileSwipe data={data} />
            </PhoneFrame>
          )}
        </div>
      </div>
    </div>
  );
}

function Tweaks({ t, setTweak, view, setView }) {
  return (
    <TweaksPanel>
      <TweakSection label="Surface">
        <TweakRadio
          label="View"
          value={t.view}
          options={[{value:'desktop',label:'iPad'},{value:'mobile',label:'Mobile'}]}
          onChange={v => setTweak('view', v)}
        />
        {t.view === 'desktop' && (
          <TweakSelect
            label="Section"
            value={view}
            options={[
              {value:'inbox', label:'Inbox / reader'},
              {value:'kept',  label:'Kept (saved)'},
              {value:'iconset', label:'Icon set · spec'},
            ]}
            onChange={v => setView(v)}
          />
        )}
      </TweakSection>
      <TweakSection label="Theme">
        <TweakRadio
          label="Mode"
          value={t.theme}
          options={[{value:'light',label:'Cream'},{value:'dark',label:'Ink'}]}
          onChange={v => setTweak('theme', v)}
        />
        <TweakRadio
          label="Density"
          value={t.density}
          options={[
            {value:'compact',label:'Compact'},
            {value:'comfortable',label:'Balanced'},
            {value:'cozy',label:'Cozy'},
          ]}
          onChange={v => setTweak('density', v)}
        />
        <TweakToggle label="Hero images in list" value={t.imagery} onChange={v => setTweak('imagery', v)} />
      </TweakSection>
      {t.view === 'desktop' && (
        <TweakSection label="Layout">
          <TweakSelect
            label="Nav rail"
            value={t.rail}
            options={[
              {value:'full',   label:'Full · icons + labels'},
              {value:'icons',  label:'Icons + tiny labels'},
              {value:'hidden', label:'Hidden'},
            ]}
            onChange={v => setTweak('rail', v)}
          />
          <TweakSelect
            label="Focus mode"
            value={t.focus}
            options={[
              {value:'normal',  label:'Show all three columns'},
              {value:'list',    label:'Hide reading pane'},
              {value:'reading', label:'Hide list · reading-first'},
            ]}
            onChange={v => setTweak('focus', v)}
          />
          <TweakRadio
            label="Chips"
            value={t.chips}
            options={[
              {value:'labeled', label:'Icon + label'},
              {value:'icons',   label:'Icon only'},
            ]}
            onChange={v => setTweak('chips', v)}
          />
          <TweakRadio
            label="Reading type"
            value={t.fontSize}
            options={[{value:'regular',label:'Regular'},{value:'large',label:'Larger'}]}
            onChange={v => setTweak('fontSize', v)}
          />
        </TweakSection>
      )}
      {t.view === 'mobile' && (
        <TweakSection label="Mobile">
          <TweakSelect
            label="Pattern"
            value={t.mobilePattern}
            options={[
              {value:'all',     label:'Show all three'},
              {value:'stacked', label:'A · Stacked drill-down'},
              {value:'tabs',    label:'B · Bottom tab bar'},
              {value:'swipe',   label:'C · Swipeable pages'},
            ]}
            onChange={v => setTweak('mobilePattern', v)}
          />
        </TweakSection>
      )}
    </TweaksPanel>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
