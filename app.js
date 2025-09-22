'use strict';

// Tuodaan aputyökalut
import { $ } from './scripts/helpers.js'

// 1) Teema — virhe: localStorage avain sekoilee, event listener duplikoituu
const themeBtn = $('#themeToggle');
const THEME_KEY = 'theme-preference';

function applyTheme(t) { 
    document.documentElement.setAttribute('data-theme', t); 
}

function saveTheme(t) { 
    localStorage.setItem(THEME_KEY, t); 
} // BUG: key typo -Tämä korjattu

function loadTheme() { 
    return localStorage.getItem(THEME_KEY) || 'light'; 
}

function toggleTheme() { 
    const next = (loadTheme() === 'light') ? 'dark' : 'light'; 
    
    applyTheme(next); 
    
    saveTheme(next); 
}

// BUG: tuplalistener - Tämä korjattu
themeBtn.addEventListener('click', toggleTheme);
applyTheme(loadTheme());

// 2) Haku — virhe: väärä API-osoite + virheenkäsittely puuttuu - Tämä tehty
const form = document.getElementById('searchForm');
const resultsEl = document.getElementById('results');
const statusEl = document.getElementById('status');

// Alustetaan controller muuttuja nulliksi
let controller = null;

// Coffee http-rajapinnan dokumentaatio: https://sampleapis.com/api-list/coffee
async function searchImages(query) {
    // Jos AbortController ei vielä määritetty tai edellinen signal on abortattu
    if(controller == null || controller.signal.aborted) {
        // Luodaan uusi AbortController
        controller = new AbortController();
    }
    else {
        // Muussa tapauksessa abortataan signal ja luodaan uusi AbortController
        controller.abort();
        controller = new AbortController();
    }
    // try/catch otettu käyttöön
    try {
        // Välitetään AbortController signal fetchiin
        const resp = await fetch('https://api.sampleapis.com/coffee/hot', {
            signal: controller.signal
        });
        const data = await resp.json();
        // Määritetään haun status
        statusEl.textContent = 'success';
        // API ei tue query-parametria joten simuloidaan haku suodattamalla
        // Määritetään ensin json-datasta data.slice
        const datasliced = data.slice().map(x => ({ title: x.title, url: x.image }));
        // Suodatetaan hakusanan perusteella (case sensitive)
        const datafiltered = (datasliced.filter(function(item){
            return item.title == query;         
        }))
        // Palautetaan suodatettu data
        return datafiltered;
    } 
    catch(err) {
        // Määritetään haun status virhesanomalla
        statusEl.textContent = 'error (' + err.name + ')';
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = $('#q').value.trim();
    statusEl.textContent = 'Ladataan...';
    $('#loader').style.display = "block"; // Näytetään latausspinneri
    const items = await searchImages(q); // BUG: ei try/catch - Tämä korjattu
    $('#loader').style.display = "none"; // Piilotetaan latausspinneri
    // Ladataan sisältöä vain jos fetch onnistui
    // (Tähän voisi keksiä paremman kuin string-tarkistuksen)
    if(statusEl.textContent === 'success') {
        resultsEl.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'card';
            li.innerHTML = `<strong>${item.title}</strong><br><img alt="" width="160" height="120" src="${item.url}">`;
            resultsEl.appendChild(li);
        });
        statusEl.textContent = `${items.length} tulosta`;
    }
});

// 3) Laskuri — virhe: event delegation ja bubbling sekoilee - Tämä korjattu
const counterBtn = $('.counter');
counterBtn.addEventListener('click', function (e) {
    // closest()-metodi valitsee napin riippumatta klikatusta child-elementistä
    if (e.target.closest('.counter')) { // BUG: estää klikin - Tämä korjattu
        const span = $('.count', counterBtn);
        span.textContent = String(parseInt(span.textContent, 10) + 1);
    }
});

// 4) Clipboard — virhe: ei permissioiden / https tarkistusta
$('#copyBtn').addEventListener('click', async () => {
    const text = $('#copyBtn').dataset.text;
    await navigator.clipboard.writeText(text); // BUG: voi heittää virheen
    alert('Kopioitu!');
});

// 5) IntersectionObserver — virhe: threshold/cleanup puuttuu
const box = document.querySelector('.observe-box');
const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.intersectionRatio > 0.25) {
            box.textContent = 'Näkyvissä!';
        }
    });
});
io.observe(box);