// Weather widget — native Flutter UI via JSON tree
// Uses wttr.in free API (fetched through Dart, no CORS)
// Features animated transitions between city changes.
// All chrome colors come from jsr.theme (follows the host's light/dark
// mode); weather icons are hand-drawn SVG — deterministic rendering on
// every platform, including golden tests.
(function() {
  var city = 'London';
  var _inputCity = city;
  var _lastData = null; // last successful payload, kept for theme re-renders

  // The host fetch has no timeout of its own — a hanging request must not
  // spin the loader forever.
  function withTimeout(promise, ms, message) {
    return new Promise(function(resolve, reject) {
      var done = false;
      setTimeout(function() {
        if (!done) { done = true; reject(new Error(message)); }
      }, ms);
      promise.then(function(v) {
        if (!done) { done = true; resolve(v); }
      }, function(e) {
        if (!done) { done = true; reject(e); }
      });
    });
  }

  // Hand-drawn SVG weather icons.
  var WX = {
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#fbbf24"/><g stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round"><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></g></svg>',
    partly: '<svg viewBox="0 0 24 24"><circle cx="8.5" cy="8.5" r="3.4" fill="#fbbf24"/><path d="M9 18a4 4 0 0 1 .6-8 5.5 5.5 0 0 1 10.4 1.5A3.5 3.5 0 0 1 19.5 18z" fill="#cbd5e1"/></svg>',
    cloud: '<svg viewBox="0 0 24 24"><path d="M6.5 18a4 4 0 0 1 .6-8 5.5 5.5 0 0 1 10.4 1.5A3.5 3.5 0 0 1 17 18z" fill="#94a3b8"/></svg>',
    rain: '<svg viewBox="0 0 24 24"><path d="M6.5 14a4 4 0 0 1 .6-8 5.5 5.5 0 0 1 10.4 1.5A3.5 3.5 0 0 1 17 14z" fill="#94a3b8"/><g stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round"><path d="M9 17l-1 3M13 17l-1 3M17 17l-1 3"/></g></svg>',
    snow: '<svg viewBox="0 0 24 24"><path d="M6.5 14a4 4 0 0 1 .6-8 5.5 5.5 0 0 1 10.4 1.5A3.5 3.5 0 0 1 17 14z" fill="#cbd5e1"/><g stroke="#e0f2fe" stroke-width="1.5" stroke-linecap="round"><path d="M9 17.5v3M7.7 19l2.6 0M13 17.5v3M11.7 19l2.6 0M17 17.5v3M15.7 19l2.6 0"/></g></svg>',
    storm: '<svg viewBox="0 0 24 24"><path d="M6.5 13a4 4 0 0 1 .6-8 5.5 5.5 0 0 1 10.4 1.5A3.5 3.5 0 0 1 17 13z" fill="#64748b"/><path d="M12.5 12.5 9.5 17.5h2.2L10.8 21.5 15 15.8h-2.4z" fill="#facc15"/></svg>',
    fog: '<svg viewBox="0 0 24 24"><path d="M6.5 12a4 4 0 0 1 .6-8 5.5 5.5 0 0 1 10.4 1.5A3.5 3.5 0 0 1 17 12z" fill="#cbd5e1"/><g stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"><path d="M5 15.5h12M7 18h11M9 20.5h8"/></g></svg>',
    temp: '<svg viewBox="0 0 24 24"><path d="M10 13.5V5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0z" fill="#e2e8f0"/><circle cx="12" cy="17" r="1.8" fill="#f43f5e"/></svg>',
    drop: '<svg viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" fill="#38bdf8"/><path d="M9 14a3 3 0 0 0 2 2.8" stroke="#bae6fd" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>',
    wind: '<svg viewBox="0 0 24 24"><g stroke="#7dd3fc" stroke-width="1.8" fill="none" stroke-linecap="round"><path d="M3 8h9.5a2.5 2.5 0 1 0-2.4-3.2M3 12.5h13.5a2.5 2.5 0 1 1-2.4 3.2M3 17h7.5"/></g></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="#94a3b8" stroke-width="1.6"/><circle cx="12" cy="12" r="3.2" fill="#38bdf8"/></svg>',
  };

  function iconForDesc(desc) {
    var d = desc.toLowerCase();
    if (d.indexOf('sun') >= 0 || d.indexOf('clear') >= 0) return WX.sun;
    if (d.indexOf('part') >= 0) return WX.partly;
    if (d.indexOf('cloud') >= 0 || d.indexOf('overcast') >= 0) return WX.cloud;
    if (d.indexOf('rain') >= 0 || d.indexOf('drizzle') >= 0) return WX.rain;
    if (d.indexOf('snow') >= 0 || d.indexOf('blizzard') >= 0) return WX.snow;
    if (d.indexOf('thunder') >= 0) return WX.storm;
    if (d.indexOf('fog') >= 0 || d.indexOf('mist') >= 0) return WX.fog;
    return WX.temp;
  }

  function _stat(t, icon, label, value) {
    return {type:'column',crossAxisAlignment:'center',mainAxisSize:'min',children:[
      {type:'svg',data:icon,size:18},
      {type:'sizedBox',height:2},
      {type:'text',data:value,style:{color:t.text,fontSize:13,fontWeight:'w600'}},
      {type:'text',data:label,style:{color:t.muted,fontSize:10}},
    ]};
  }

  function render(d) {
    // Read jsr.theme fresh on every render — the object is merged in place
    // when the host theme changes.
    var t = jsr.theme;
    jsr.render({
      type: 'animatedOpacity',
      opacity: 1.0,
      duration: 400,
      curve: 'easeInOut',
      child: {
      type: 'listView',
      shrinkWrap: false,
      children: [
        // Header with animated temperature
        {type:'animatedContainer', duration:500, curve:'easeOut',
         decoration:{color:t.surface, borderRadius:0},
         padding:[16,20,16,16],
         child:{type:'column',crossAxisAlignment:'center',children:[
          {type:'svg', data:d.icon, size:52},
          {type:'sizedBox',height:4},
          {type:'text',data:d.areaName+', '+d.country,
           style:{color:t.muted,fontSize:12,textAlign:'center'}},
          {type:'sizedBox',height:6},
          {type:'text',data:d.tempC+'°C',
           style:{fontSize:40,fontWeight:'w700',color:t.text,textAlign:'center'}},
          {type:'text',data:d.desc,
           style:{color:t.text,fontSize:13,textAlign:'center'}},
        ]}},
        // Stats row
        {type:'padding',padding:[12,12,12,8],child:{type:'row',
          mainAxisAlignment:'spaceAround',
          children:[
            _stat(t,WX.drop,'Humidity',d.humidity+'%'),
            _stat(t,WX.wind,'Wind',d.windKmph+' km/h'),
            _stat(t,WX.temp,'Feels',d.feelsLikeC+'°C'),
            _stat(t,WX.eye,'Vis.',d.visibilityKm+' km'),
          ]
        }},
        // City input row
        {type:'padding',padding:[12,0,12,12],child:{type:'row',crossAxisAlignment:'center',children:[
          {type:'expanded',child:{
            type:'textField',
            value: city,
            hint: 'Enter city…',
            onSubmit: 'submit_city',
            onChange: 'city_input_change',
          }},
          {type:'sizedBox',width:8},
          {type:'textButton',text:'Go',onTap:'submit_city_btn'},
        ]}},
        {type:'padding',padding:[0,0,12,8],child:{
          type:'text',
          data:'via wttr.in',
          style:{color:t.muted,fontSize:10,textAlign:'right'},
        }},
      ]
    }});
  }

  async function load() {
    jsr.exportState({ loading: true, query: city });
    jsr.render({type:'center',child:{type:'circularProgressIndicator',size:24}});
    try {
      var url = 'https://wttr.in/' + encodeURIComponent(city) + '?format=j1';
      var data = await withTimeout(jsr.fetchJson(url), 10000, 'Request timed out');
      var cur = data.current_condition[0];
      var area = data.nearest_area[0];

      jsr.setTitle('Weather — ' + area.areaName[0].value);

      _lastData = {
        icon: iconForDesc(cur.weatherDesc[0].value),
        areaName: area.areaName[0].value,
        country: area.country[0].value,
        tempC: cur.temp_C,
        desc: cur.weatherDesc[0].value,
        humidity: cur.humidity,
        windKmph: cur.windspeedKmph,
        feelsLikeC: cur.FeelsLikeC,
        visibilityKm: cur.visibility,
      };
      render(_lastData);
      jsr.exportState({
        loading: false,
        query: city,
        city: _lastData.areaName,
        country: _lastData.country,
        tempC: _lastData.tempC,
        feelsLikeC: _lastData.feelsLikeC,
        humidity: _lastData.humidity,
        windKmph: _lastData.windKmph,
        visibilityKm: _lastData.visibilityKm,
        description: _lastData.desc,
      });
    } catch(e) {
      jsr.exportState({ loading: false, query: city, error: e.message || String(e) });
      jsr.showError('Could not load weather:\n'+e.message);
    }
  }

  function cityFromPayload(payload) {
    if (!payload) return '';
    return String(
      payload.city || payload.value || payload.name || '',
    ).trim();
  }

  async function handleEvent(actionId, payload) {
    if (actionId === 'city_input_change') {
      _inputCity = payload.value;
    } else if (
      actionId === 'set_city' ||
      actionId === 'submit_city' ||
      actionId === 'submit_city_btn'
    ) {
      var newCity = cityFromPayload(payload) || _inputCity.trim();
      if (!newCity) return;
      city = newCity;
      _inputCity = city;
      await jsr.storage.set('city', city);
      await load();
    }
  }

  jsr.onEvent(handleEvent);
  // Re-render with the new colors when the host flips light/dark mode.
  jsr.onThemeChange(function() {
    if (_lastData) render(_lastData);
  });
  jsr.storage.get('city').then(function(saved) {
    if (saved) { city = saved; _inputCity = saved; }
    load();
    setInterval(load, 10 * 60 * 1000);
  });
})();
