// Tag littérale minimale (pas d'exécution particulière, juste de la
// coloration syntaxique GROQ dans l'éditeur). On évite d'importer `groq`
// depuis le paquet `next-sanity` : son export groupé embarque des Server
// Actions (live preview) incompatibles avec l'export statique.
function groq(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, s, i) => acc + s + (values[i] !== undefined ? String(values[i]) : ""), "");
}

const filmFields = groq`
  _id,
  title,
  "slug": slug.current,
  originalTitle,
  director,
  year,
  country,
  duration,
  language,
  subtitles,
  ageRating,
  genres,
  status,
  synopsis,
  posterSize,
  featuredHome,
  poster,
  stillImages,
  trailerUrl,
  price,
  sumupCheckoutUrl,
  "review": review->{_id, quote, author, source, url}
`;

const screeningFields = groq`
  _id,
  date,
  time,
  room,
  versionNote,
  status,
  price,
  sumupCheckoutUrl,
  "film": film->{_id, title, "slug": slug.current, director, poster}
`;

export const filmsQuery = groq`*[_type == "film"] | order(status asc, year desc) {${filmFields}}`;

export const filmBySlugQuery = groq`*[_type == "film" && slug.current == $slug][0]{
  ${filmFields},
  "screenings": *[_type == "screening" && references(^._id)] | order(date asc, time asc) {${screeningFields}}
}`;

export const screeningsQuery = groq`*[_type == "screening"] | order(date asc, time asc) {${screeningFields}}`;

export const announcementsQuery = groq`*[_type == "announcement"] | order(pinned desc, date desc) {
  _id, title, "slug": slug.current, category, date, image, excerpt, body, linkUrl, pinned
}`;

export const historyQuery = groq`*[_type == "historyEntry"] | order(order asc) {
  _id, year, title, body, image, order
}`;

export const siteSettingsQuery = groq`*[_type == "siteSettings"][0]{
  tagline, seoDescription, historyIntro, address, phone, email, openingHours, accessInfo, mapUrl, socialLinks
}`;
