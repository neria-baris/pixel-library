<div dir="rtl">

# הספרייה — אב טיפוס בפיקסל ארט

אב טיפוס אינטראקטיבי בעברית ובאנגלית לממשק ספרייה של כלי תרגום ספרים: מדפים מאוירים, חתול ספרייה שמסתובב בעמוד, כריכה מתהפכת ותהליך תרגום מדומה. הכול HTML/CSS/JS מקומי, בלי תלויות ובלי שרת.

**צפייה אונליין:** https://neria-baris.github.io/pixel-library/ 

**פתיחה מקומית:** פתחו את [`design/pixel-library/library.html`](design/pixel-library/library.html) בדפדפן (אנגלית: [`library-en.html`](design/pixel-library/library-en.html)). אבות הטיפוס המוקדמים להשוואה נמצאים ב־[`index.html`](design/pixel-library/index.html).

זהו אב טיפוס עיצובי בלבד: אין בו תרגום אמיתי, קריאות למודלים, מפתחות או שמירת נתונים. רענון מחזיר את מצב הדוגמה.

## הליכי הפיתוח

המאגר כולל את תהליך הפיתוח המלא, ולא רק את התוצר:

| מה | איפה |
|---|---|
| היסטוריית הקומיטים, שלב אחרי שלב | `git log` |
| מחקר, השוואת חלופות וממצאים | [`docs/design/pixel-library/RESEARCH_AND_AUDIT_HE.md`](docs/design/pixel-library/RESEARCH_AND_AUDIT_HE.md), [`COMPARISON_HE.md`](docs/design/pixel-library/COMPARISON_HE.md) |
| תיעוד כל סבב משוב ושינוי, עם צילומי מסך | [`docs/design/pixel-library/`](docs/design/pixel-library/) (קובצי `*_HE.md` ותיקיות הצילומים) |
| חוזה לכל שלב: קלט, פלט, אינווריאנטים ובדיקות קבלה | [`audit/contracts/`](audit/contracts/) |
| קבלות אימות ונקודות ביקורת לכל מסירה | [`audit/checkpoints/`](audit/checkpoints/) |
| בדיקות דפדפן (Chrome DevTools Protocol) ותוצאותיהן | [`scripts/design/`](scripts/design/), קובצי `verification.json` |

סדר השלבים: UX-PIXEL (שתי חלופות) ← UX-READING-CONTROLS ← ליטוש לפי משוב ← ספרים עם אופי ← הנפשה וחתול ← מחשבות החתול ← UX-LIBRARY-ROAMING (הגרסה המאוחדת, כולל אנגלית).

## הרצת הבדיקות

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/design/preview_pixel_library.ps1 -Port 8817
node --experimental-websocket scripts/design/verify_library_roaming.mjs
```

השרת המקומי משרת את אבות הטיפוס. הבדיקה של הגרסה העדכנית מפעילה Chrome ללא ממשק (הנתיב נקבע במשתנה `CHROME`). סקריפטי ה־PowerShell של השלבים הקודמים מתוארים בקובצי התיעוד שלהם.

## מקור

הקבצים חולצו מענף העיצוב `design/pixel-library-prototypes` של פרויקט פרטי, יחד עם היסטוריית הקומיטים שלהם. חלק מהמסמכים מפנים לקבצים של האפליקציה המלאה (`ui.html`, `web_ui.py` וכדומה) שאינם כלולים כאן.

הגופן Frank Ruhl Libre מופץ תחת רישיון SIL Open Font License 1.1 ([`fonts/OFL-FrankRuhlLibre.txt`](design/pixel-library/fonts/OFL-FrankRuhlLibre.txt)).

</div>
