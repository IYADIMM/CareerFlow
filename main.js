(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => mq.matches;
  const visibility = () => !document.hidden;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const TWO_PI = Math.PI * 2;
  const state = { role: 'leadership', roleScore: 92 };
  const roles = {
    leadership: { label: 'COMMERCIAL LEADERSHIP', score: 92, from: 12, to: 31, insight: 'Leadership paths reward strategic impact and team development. Prioritize roles with meaningful decision-making scope.' },
    strategy: { label: 'BUSINESS & CATEGORY STRATEGY', score: 87, from: 19, to: 38, insight: 'Strategy paths build on analytical reasoning, commercial judgment, and measurable business outcomes.' },
    operations: { label: 'OPERATIONS EXCELLENCE', score: 90, from: 29, to: 48, insight: 'Operations roles reward execution, cross-functional coordination, and consistent improvement at scale.' }
  };

  // The intro never blocks visitors who prefer reduced motion.
  const intro = $('#intro');
  const headline = $('#hero-title');
  let glyphIndex = 0;
  function splitText(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const fragment = document.createDocumentFragment();
      for (const ch of node.textContent) {
        if (/\s/.test(ch)) { fragment.appendChild(document.createTextNode(ch)); continue; }
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        span.style.setProperty('--char-index', glyphIndex++);
        span.setAttribute('aria-hidden', 'true');
        fragment.appendChild(span);
      }
      node.replaceWith(fragment);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
      [...node.childNodes].forEach(splitText);
    }
  }
  if (headline) {
    headline.setAttribute('aria-label', headline.innerText.replace(/\s+/g, ' ').trim());
    [...headline.childNodes].forEach(splitText);
  }
  const showContent = () => headline?.classList.add('is-visible');
  if (reduced()) {
    intro?.remove();
    showContent();
  } else {
    window.setTimeout(() => {
      intro?.classList.add('is-clearing');
      showContent();
    }, 2050);
    window.setTimeout(() => intro?.classList.add('is-gone'), 2580);
  }

  // Reveals are one-shot and never hold content hostage without IntersectionObserver.
  const reveals = $$('.reveal');
  if (!reduced() && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('revealed'));

  const mobileMenu = $('.mobile-menu-toggle');
  const mobileNav = $('#mobile-nav');
  function closeMobile() {
    if (!mobileMenu || !mobileNav) return;
    mobileMenu.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-label', 'Open navigation');
    mobileNav.hidden = true;
  }
  mobileMenu?.addEventListener('click', () => {
    const opened = mobileMenu.getAttribute('aria-expanded') !== 'true';
    mobileMenu.setAttribute('aria-expanded', String(opened));
    mobileMenu.setAttribute('aria-label', opened ? 'Close navigation' : 'Open navigation');
    mobileNav.hidden = !opened;
  });
  $$('.mobile-nav a').forEach(a => a.addEventListener('click', closeMobile));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobile(); });
  $('#year').textContent = String(new Date().getFullYear());

  function sizeCanvas(canvas, maxDpr = 2) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h, ctx, dpr };
  }

  // Shader-built background: zero bitmaps, three additive travelling light ribbons.
  function createRibbon() {
    const canvas = $('#ribbon-canvas');
    if (!canvas) return;
    let gl;
    try { gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true }); } catch (_) {}
    let raf = 0, live = true;
    const vert = `attribute vec2 a_position; void main(){gl_Position=vec4(a_position,0.0,1.0);}`;
    const frag = `precision highp float;
      uniform vec2 u_resolution; uniform float u_time;
      float ribbon(vec2 uv, float index) {
        float speed = u_time * (0.115 + index * 0.022);
        float center = 0.70 - index*0.063 + 0.105*sin(uv.x*4.8 + speed + index*1.75)
                     + 0.075*sin(uv.x*10.6 - speed*0.72 + index*2.55);
        float d = abs(uv.y-center);
        float core = 1.0-smoothstep(0.012,0.061,d);
        float feather = (1.0-smoothstep(0.01,0.22,d))*0.31;
        return core*0.82 + feather;
      }
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float aspect = u_resolution.x/u_resolution.y;
        vec2 p = vec2((uv.x-.5)*aspect,uv.y);
        float a = ribbon(uv,0.0); float b = ribbon(uv,1.0); float c = ribbon(uv,2.0);
        vec3 light = vec3(0.388,0.400,0.945)*a + vec3(0.64,0.34,0.95)*b + vec3(0.10,0.72,0.91)*c;
        float middle = exp(-dot(p-vec2(0.06,0.60),p-vec2(0.06,0.60))*2.8)*0.12;
        light += vec3(.30,.29,.64)*middle;
        float flash = clamp((a*b + b*c + a*c)*0.35,0.0,0.42);
        light += vec3(flash*0.66,flash*0.70,flash*0.78);
        float vignette = 1.0-smoothstep(.5,1.45,length(p*vec2(.82,1.2)));
        float alpha = clamp(max(max(a,b),c)*0.85+middle+flash,0.0,.97)*mix(.48,1.0,vignette);
        gl_FragColor = vec4(min(light,vec3(1.0)),alpha);
      }`;
    function compile(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { const info = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw Error(info); }
      return shader;
    }
    let program, position, uResolution, uTime, buffer;
    if (gl) {
      try {
        program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER,vert));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER,frag));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
        position = gl.getAttribLocation(program,'a_position');
        uResolution = gl.getUniformLocation(program,'u_resolution');
        uTime = gl.getUniformLocation(program,'u_time');
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
        gl.useProgram(program); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      } catch (e) { console.warn('WebGL unavailable, using 2D fallback.', e); gl = null; }
    }
    function fallback(t) {
      // A WebGL context usually cannot switch to 2D; replace that canvas only when necessary.
      if (!canvas._fallback) {
        const substitute = document.createElement('canvas');
        substitute.className = canvas.className;
        substitute.id = canvas.id;
        substitute.setAttribute('aria-hidden','true');
        canvas.replaceWith(substitute);
        canvas._fallback = substitute;
      }
      const { w,h,ctx } = sizeCanvas(canvas._fallback,1.5);
      if (!ctx) return;
      ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';
      const colors = ['99,102,241','164,87,242','31,183,232'];
      colors.forEach((color,i) => {
        const path = new Path2D();
        for(let x=0;x<=w+3;x+=3) {
          const xx=x/w;
          const line=(.70-i*.063)+.105*Math.sin(xx*4.8+t*(.115+i*.022)+i*1.75)+.075*Math.sin(xx*10.6-t*.09+i*2.55);
          const y=h*(1-line);
          if(x===0) path.moveTo(x,y); else path.lineTo(x,y);
        }
        ctx.strokeStyle=`rgba(${color},.07)`; ctx.lineWidth=Math.max(60,h*.22);ctx.lineCap='round';ctx.stroke(path);
        ctx.strokeStyle=`rgba(${color},.28)`;ctx.lineWidth=Math.max(20,h*.08);ctx.stroke(path);
        ctx.strokeStyle=`rgba(${color},.60)`;ctx.lineWidth=Math.max(4,h*.016);ctx.stroke(path);
      });
      ctx.globalCompositeOperation='source-over';
    }
    function render(t) {
      if (!live || !visibility()) return;
      const tt = reduced()?0:t*.001;
      if (gl) {
        const dpr = Math.min(window.devicePixelRatio||1,1.6);
        const w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
        gl.useProgram(program);gl.uniform2f(uResolution,w,h);gl.uniform1f(uTime,tt);gl.drawArrays(gl.TRIANGLES,0,6);
      } else fallback(tt);
      if (!reduced()) raf=requestAnimationFrame(render);
    }
    function start(){cancelAnimationFrame(raf);live=true;raf=requestAnimationFrame(render);}
    function stop(){live=false;cancelAnimationFrame(raf);}
    document.addEventListener('visibilitychange',()=>visibility()?start():stop());
    mq.addEventListener?.('change',start);
    window.addEventListener('resize',()=>{if(reduced()) start();});
    start();
  }
  createRibbon();

  // Four genuinely independent animated canvases, paused when off-screen.
  function drawTrajectory(ctx,w,h,t) {
    const ymid=h*.54;const amp=h*.30;
    for(let j=0;j<2;j++) {
      ctx.beginPath();
      for(let x=0;x<=w;x+=2) {
        const p=x/w;
        const envelope=.35+.5*(.5+.5*Math.sin(p*7.4-t*.7));
        const yy=ymid+Math.sin(p*31-t*2.0+j*.8)*amp*envelope*(j? .43:1);
        x===0?ctx.moveTo(x,yy):ctx.lineTo(x,yy);
      }
      ctx.lineWidth=j?1:1.7;ctx.strokeStyle=j?'rgba(255,255,255,.21)':'rgba(145,146,255,.92)';ctx.stroke();
    }
    ctx.beginPath();ctx.arc(w*(.42+.07*Math.sin(t*.3)),ymid,2,0,TWO_PI);ctx.fillStyle='#fff';ctx.fill();
  }
  function drawSkills(ctx,w,h,t) {
    const count=13,gap=5,bw=(w-gap*(count-1))/count,bh=16;
    for(let row=0;row<3;row++)for(let col=0;col<count;col++){
      const a=.09+.65*(.5+.5*Math.sin(col*.52+row*1.7-t*1.1));
      const selected=(col>=4&&col<=8&&row===1);
      ctx.fillStyle=selected?`rgba(130,133,255,${Math.max(.25,a)})`:`rgba(255,255,255,${a*.41})`;
      ctx.fillRect(col*(bw+gap),h*.25+row*(bh+6),bw,bh);
    }
  }
  function drawPathways(ctx,w,h,t) {
    const ys=[h*.21,h*.41,h*.61,h*.81];
    ys.forEach((y,i)=>{
      ctx.beginPath();for(let x=0;x<=w;x+=2){const p=x/w;const yy=y+Math.sin(p*(15+i*4)-t*(.75+i*.19))*2.7;x===0?ctx.moveTo(x,yy):ctx.lineTo(x,yy)}
      ctx.strokeStyle=`rgba(${i===1?'145,146,255':'255,255,255'},${.26+i*.17})`;ctx.lineWidth=i===1?1.8:1.1;ctx.stroke();
      const px=((t*(13+i*3)+i*55)%w);ctx.beginPath();ctx.arc(px,y+Math.sin(px/w*(15+i*4)-t*(.75+i*.19))*2.7,2.8,0,TWO_PI);ctx.fillStyle=i===1?'#a5a6ff':'rgba(255,255,255,.85)';ctx.fill();
    });
  }
  function drawReadiness(ctx,w,h,t) {
    const x=w/2,y=h/2,rad=Math.min(w*.15,h*.40);
    ctx.beginPath();ctx.arc(x,y,rad,0,TWO_PI);ctx.strokeStyle='rgba(255,255,255,.17)';ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath();ctx.arc(x,y,rad,-Math.PI/2+t*.65,-Math.PI/2+t*.65+Math.PI*.66);ctx.strokeStyle='#9c9eff';ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();
    ctx.beginPath();ctx.arc(x,y,3,0,TWO_PI);ctx.fillStyle='#fff';ctx.fill();
    for(let i=0;i<4;i++){let a=t*.36+i*TWO_PI/4;ctx.beginPath();ctx.arc(x+Math.cos(a)*rad*1.36,y+Math.sin(a)*rad*1.36,1.6,0,TWO_PI);ctx.fillStyle='rgba(255,255,255,.4)';ctx.fill()}
  }
  const artists={trajectory:drawTrajectory,skills:drawSkills,pathways:drawPathways,readiness:drawReadiness};
  $$('.tile-canvas').forEach(canvas => {
    let running=false,raf=0;
    const paint=time=>{
      if(!running||!visibility())return;
      const {w,h,ctx}=sizeCanvas(canvas,1.7);
      if(ctx){ctx.clearRect(0,0,w,h);artists[canvas.dataset.viz]?.(ctx,w,h,reduced()?0:time*.001);}
      if(!reduced())raf=requestAnimationFrame(paint);
    };
    const start=()=>{if(running&& !reduced())return;running=true;cancelAnimationFrame(raf);raf=requestAnimationFrame(paint)};
    const stop=()=>{running=false;cancelAnimationFrame(raf)};
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>entries.forEach(e=>e.isIntersecting?start():stop()),{rootMargin:'70px'});io.observe(canvas);
    } else start();
    document.addEventListener('visibilitychange',()=>{if(!visibility())stop();else if(canvas.getBoundingClientRect().bottom>0&&canvas.getBoundingClientRect().top<innerHeight)start()});
    mq.addEventListener?.('change',()=>{if(canvas.getBoundingClientRect().top<innerHeight)start()});
    window.addEventListener('resize',()=>{if(reduced()&&running)start()});
  });

  // Sample role-fit spectrum, with a clear selected band from first to last selected bar.
  const spectrum = $('#spectrum-canvas');
  let spectrumRun=false,spectrumFrame=0;
  function drawSpectrum(time) {
    if (!spectrumRun || !visibility()) return;
    const {w,h,ctx}=sizeCanvas(spectrum,1.65);
    if (!ctx) return;
    const t=reduced()?0:time*.001;
    ctx.clearRect(0,0,w,h);
    const N=72,padX=clamp(w*.028,12,34),usable=w-padX*2;
    const step=usable/N,barW=Math.max(2,step*.46),floor=h*.81;
    const profile=roles[state.role],first=profile.from,last=profile.to;
    // A quiet precision grid.
    ctx.lineWidth=1;
    for(let i=1;i<=3;i++){
      const y=h*(.18+i*.17);
      ctx.beginPath();ctx.moveTo(padX,y);ctx.lineTo(w-padX,y);
      ctx.strokeStyle='rgba(255,255,255,.055)';ctx.stroke();
    }
    const markX=padX+first*step-5,markEnd=padX+(last+1)*step+5;
    const markTop=h*.12,markBottom=floor+8;
    ctx.strokeStyle='rgba(133,137,255,.85)';ctx.lineWidth=1;ctx.strokeRect(markX,markTop,markEnd-markX,markBottom-markTop);
    ctx.fillStyle='rgba(99,102,241,.055)';ctx.fillRect(markX,markTop,markEnd-markX,markBottom-markTop);
    for(let i=0;i<N;i++) {
      const p=i/(N-1),half=Math.sin(p*Math.PI);
      const modulation=.64+.20*Math.sin(i*.52+t*1.75)+.16*Math.sin(i*.21-t*.9);
      let size=(.13+.70*Math.pow(Math.max(0,half),.76))*modulation;
      const selected=i>=first&&i<=last;
      // The highlighted section fills the marker vertically, so the selection is unmistakable.
      if(selected)size=Math.max(.64,size+.18);
      const barH=(h*.65)*size;
      const x=padX+i*step+(step-barW)/2;
      ctx.fillStyle=selected?'rgba(99,102,241,.97)':'rgba(255,255,255,.17)';
      ctx.fillRect(x,floor-barH,barW,barH);
    }
    if(!reduced())spectrumFrame=requestAnimationFrame(drawSpectrum);
  }
  function beginSpectrum(){cancelAnimationFrame(spectrumFrame);spectrumRun=true;spectrumFrame=requestAnimationFrame(drawSpectrum)}
  function pauseSpectrum(){spectrumRun=false;cancelAnimationFrame(spectrumFrame)}
  if('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>entries.forEach(e=>e.isIntersecting?beginSpectrum():pauseSpectrum()),{rootMargin:'70px'}).observe(spectrum);
  } else beginSpectrum();
  document.addEventListener('visibilitychange',()=>visibility()?beginSpectrum():pauseSpectrum());
  mq.addEventListener?.('change',beginSpectrum);
  window.addEventListener('resize',()=>{if(reduced())beginSpectrum()});
  function selectRole(name) {
    if(!roles[name])return;
    state.role=name;state.roleScore=roles[name].score;
    $('#signal-role-label').textContent=roles[name].label;
    $('#signal-score').textContent=String(roles[name].score);
    $$('.role-option').forEach(b=>{const yes=b.dataset.role===name;b.classList.toggle('is-active',yes);b.setAttribute('aria-pressed',String(yes))});
    if(!spectrumRun)beginSpectrum();
  }
  $$('.role-option').forEach(b=>b.addEventListener('click',()=>selectRole(b.dataset.role)));

  // Functional, honest client-side preview: no external calls, no invented job results.
  const dialog=$('#preview-dialog');
  const previewTrack=$('#career-track'), experience=$('#experience'),priority=$('#priority');
  let lastFocus;
  function renderPreview() {
    const years=Number(experience.value), role=previewTrack.value, goal=priority.value;
    const base={leadership:69,strategy:73,operations:77}[role];
    const tenure=Math.min(18,Math.round(years*.85));
    const fit={growth:0,fit:4,balance:-2}[goal];
    const score=clamp(base+tenure+fit,55,96);
    $('#experience-value').textContent=`${years}${years===25?'+':''} YEARS`;
    $('#preview-score').textContent=String(score);
    let note=roles[role].insight;
    if(years<5)note='Explore roles that build foundational skills and allow room for progression. '+note;
    if(goal==='balance')note='Consider flexibility, commute, and working arrangements alongside role scope. '+note;
    $('#preview-advice').textContent=note;
  }
  [previewTrack,experience,priority].forEach(el=>el?.addEventListener('input',renderPreview));
  function openPreview() {
    closeMobile();lastFocus=document.activeElement;
    renderPreview();dialog.showModal();document.body.classList.add('dialog-open');
    window.setTimeout(()=>previewTrack.focus(),10);
  }
  function closePreview(){if(dialog.open)dialog.close();}
  $$('[data-action="preview"]').forEach(b=>b.addEventListener('click',openPreview));
  $$('[data-action="close-preview"]').forEach(b=>b.addEventListener('click',closePreview));
  dialog?.addEventListener('click',e=>{if(e.target===dialog)closePreview()});
  dialog?.addEventListener('close',()=>{document.body.classList.remove('dialog-open');lastFocus?.focus?.()});
  $('#preview-platform-link')?.addEventListener('click',closePreview);
})();

