import { escapeHtml as e, safeUrl } from './html.mjs';

export function canonicalUrl(data) {
  const value = data.seo?.canonicalUrl;
  if (!value) return '';
  safeUrl(value);
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.search || url.hash) throw new Error('seo.canonicalUrl must be an absolute HTTPS URL without query or fragment');
  return url.href;
}

export function renderSeo(data) {
  const p = data.profile;
  const canonical = canonicalUrl(data);
  const image = canonical && data.seo?.image ? new URL(safeUrl(data.seo.image),canonical).href : '';
  return `<meta property="og:locale" content="en_US"><meta name="twitter:title" content="${e(p.firstName+' '+p.lastName+' | Portfolio')}"><meta name="twitter:description" content="${e(p.intro)}">` +
    (canonical ? `<link rel="canonical" href="${e(canonical)}"><meta property="og:url" content="${e(canonical)}">` : '') +
    (image ? `<meta property="og:image" content="${e(image)}"><meta property="og:image:alt" content="${e(data.seo.imageAlt || '')}"><meta name="twitter:image" content="${e(image)}"><meta name="twitter:image:alt" content="${e(data.seo.imageAlt || '')}">` : '');
}

export function personSchema(data) {
  const p = data.profile, canonical = canonicalUrl(data);
  return {
    '@context':'https://schema.org', '@type':'Person',
    name:p.firstName+' '+p.lastName, description:p.intro,
    email:p.email, sameAs:[p.github,p.telegram].filter(Boolean),
    ...(canonical ? {url:canonical,'@id':canonical+'#person'} : {}),
    alumniOf:{'@type':'CollegeOrUniversity',name:data.education.university},
    knowsAbout:['Industrial Management','Business Analytics','ERP','Manufacturing Operations','Digital Transformation','Sustainable Management'],
    knowsLanguage:[{'@type':'Language',name:'Uzbek',alternateName:'uz'},{'@type':'Language',name:'English',alternateName:'en'},{'@type':'Language',name:'Russian',alternateName:'ru'}]
  };
}

export function discoveryFiles(data) {
  const canonical = canonicalUrl(data);
  return {
    robots: 'User-agent: *\nAllow: /\n' + (canonical ? 'Sitemap: '+new URL('sitemap.xml',canonical).href+'\n' : ''),
    sitemap: '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+(canonical ? '<url><loc>'+e(canonical)+'</loc></url>' : '')+'</urlset>\n'
  };
}
