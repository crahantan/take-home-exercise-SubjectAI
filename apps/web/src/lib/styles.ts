/** Inline CSS for the whole page. Keep it small: it travels in the first round trips. */
export const STYLES = `
*{box-sizing:border-box}
body{margin:0;font:1rem/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1d2433;background:#f4f7fb}
main{max-width:32rem;margin:0 auto;padding:1.5rem 1rem 2rem}
h1{font-size:1.75rem;line-height:1.2;margin:0 0 .5rem}
h2{font-size:1.375rem;line-height:1.25;margin:.25rem 0 .75rem}
p{margin:0 0 1rem}
.lead{font-size:1.125rem}
.card{background:#fff;border:2px solid #1d4ed8;border-radius:.75rem;padding:1.25rem 1.25rem .25rem;margin-bottom:1rem}
.label{display:inline-block;margin:0;padding:.125rem .625rem;border-radius:1rem;background:#1d4ed8;color:#fff;font-weight:700}
.note{color:#4a5568}
details{background:#fff;border:1px solid #9aa5b8;border-radius:.75rem;padding:0 1.25rem;margin-bottom:1rem}
summary{min-height:44px;padding:.625rem 0;font-weight:700;cursor:pointer}
details[open] summary{border-bottom:1px solid #d5dbe6;margin-bottom:.75rem}
.results{display:flex;gap:.5rem;list-style:none;margin:0 0 1rem;padding:0}
.results li{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border:2px solid;border-radius:.5rem;font-size:1.375rem;font-weight:700}
.right{color:#0b6b3a;border-color:#0b6b3a;background:#e7f6ee}
.wrong{color:#a12622;border-color:#a12622;background:#fdeceb}
a.button,button,select{min-height:44px;font:inherit;border-radius:.5rem}
a.button,button{display:inline-flex;align-items:center;padding:0 1.25rem;border:0;background:#1d4ed8;color:#fff;font-weight:700;text-decoration:none;cursor:pointer}
select{padding:0 .5rem;border:1px solid #6b7588;background:#fff;color:inherit}
form{margin-top:2rem;padding-top:1rem;border-top:1px solid #d5dbe6}
label{display:block;margin-bottom:.5rem}
`;
