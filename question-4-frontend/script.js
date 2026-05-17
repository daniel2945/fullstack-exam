const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const daysContainer = document.getElementById('daysContainer');
const monthYearDisplay = document.getElementById('monthYear');
const toggleViewBtn = document.getElementById('toggleViewBtn');

let currentDate = new Date();
let isWeeklyView = false;
let events = JSON.parse(localStorage.getItem('calendarEvents')) || {};
let holidaysCache = {}; 

// חדש: משתנה לשמירת ה-ID של התא שכרגע ערכנו, כדי להפעיל עליו את האנימציה
let lastEditedDateKey = null;

const hebrewDayNumericFormatter = new Intl.DateTimeFormat('en-US-u-ca-hebrew', { day: 'numeric' });
const hebrewMonthFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' });

function getGematria(num) {
    const letters = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב", "יג", "יד", "טו", "טז", "יז", "יח", "יט", "כ", "כא", "כב", "כג", "כד", "כה", "כו", "כז", "כח", "כט", "ל"];
    let str = letters[num] || "";
    if (str.length === 1) return str + "'";
    if (str.length > 1) return str.slice(0, -1) + '"' + str.slice(-1);
    return str;
}

async function fetchHolidays(year, month) {
    const key = `${year}-${month}`;
    if (holidaysCache[key]) return holidaysCache[key];

    try {
        const res = await fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&il=on&year=${year}&month=${month}`);
        const data = await res.json();
        const holidays = {};
        
        if (data.items) {
            data.items.forEach(item => {
                holidays[item.date] = item.hebrew;
            });
        }
        holidaysCache[key] = holidays;
        return holidays;
    } catch (e) {
        console.error("שגיאה בטעינת חגים:", e);
        return {};
    }
}

async function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    const holidays = await fetchHolidays(year, month + 1);

    daysContainer.innerHTML = '';
    
    // הפעלה מחדש של אנימציית הכניסה לחודש/שבוע (הפכנו אותה לברורה יותר)
    daysContainer.classList.remove('fade-in');
    void daysContainer.offsetWidth; 
    daysContainer.classList.add('fade-in');

    let startDate, endDate;

    if (isWeeklyView) {
        const dayOfWeek = currentDate.getDay();
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - dayOfWeek); 
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); 
        monthYearDisplay.textContent = `שבוע של ${startDate.getDate()} ב${monthNames[startDate.getMonth()]} ${year}`;
    } else {
        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        
        const firstDayIndex = startDate.getDay();
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('day', 'empty');
            daysContainer.appendChild(emptyDiv);
        }
    }

    let currentRenderDate = new Date(startDate);
    while (currentRenderDate <= endDate) {
        const i = currentRenderDate.getDate();
        const m = currentRenderDate.getMonth();
        const y = currentRenderDate.getFullYear();
        const eventKey = `${y}-${m + 1}-${i}`;

        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');

        // *** בונוס 3: לוגיקה משופרת להפעלת אנימציית 'pop-in' ***
        // אם התא הזה הוא התא האחרון שכרגע ערכנו, אנחנו מוסיפים לו את קלאס האנימציה
        if (eventKey === lastEditedDateKey) {
            dayDiv.classList.add('pop-in');
            // מאפסים את המשתנה מיד כדי שהאנימציה לא תקרה שוב ברענון הבא
            lastEditedDateKey = null; 
        }

        if (i === today.getDate() && m === today.getMonth() && y === today.getFullYear()) {
            dayDiv.classList.add('today');
        }

        const dateNum = document.createElement('div');
        dateNum.classList.add('date-number');
        dateNum.textContent = i;
        dayDiv.appendChild(dateNum);

        const hebDayNum = parseInt(hebrewDayNumericFormatter.format(currentRenderDate)); 
        const hebMonthName = hebrewMonthFormatter.format(currentRenderDate); 
        const hebDateStr = `${getGematria(hebDayNum)} ב${hebMonthName}`; 

        const hebDateEl = document.createElement('div');
        hebDateEl.classList.add('heb-date');
        hebDateEl.textContent = hebDateStr;
        dayDiv.appendChild(hebDateEl);

        const dateKeyObj = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (holidays[dateKeyObj]) {
            const holidayEl = document.createElement('div');
            holidayEl.classList.add('holiday-text');
            holidayEl.textContent = holidays[dateKeyObj];
            dayDiv.appendChild(holidayEl);
        }

        if (events[eventKey]) {
            const eventDiv = document.createElement('div');
            eventDiv.classList.add('event-text');
            eventDiv.textContent = events[eventKey];
            dayDiv.appendChild(eventDiv);
        }

        dayDiv.addEventListener('click', () => {
            const eventDesc = prompt(`הכנס אירוע לתאריך ${i}.${m + 1}.${y}:`, events[eventKey] || '');
            if (eventDesc !== null) {
                if (eventDesc.trim() === '') {
                    delete events[eventKey];
                } else {
                    events[eventKey] = eventDesc;
                }
                localStorage.setItem('calendarEvents', JSON.stringify(events));

                // חדש: מסמנים את התא שכרגע ערכנו כדי ש-renderCalendar יפעיל עליו את האנימציה
                lastEditedDateKey = eventKey;
                renderCalendar(); // מרנדרים מחדש כדי שרואים את השינוי
            }
        });

        daysContainer.appendChild(dayDiv);
        currentRenderDate.setDate(currentRenderDate.getDate() + 1); 
    }
}

document.getElementById('prevBtn').addEventListener('click', () => {
    if (isWeeklyView) {
        currentDate.setDate(currentDate.getDate() - 7);
    } else {
        currentDate.setMonth(currentDate.getMonth() - 1);
    }
    renderCalendar();
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (isWeeklyView) {
        currentDate.setDate(currentDate.getDate() + 7);
    } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    renderCalendar();
});

toggleViewBtn.addEventListener('click', () => {
    isWeeklyView = !isWeeklyView;
    toggleViewBtn.textContent = isWeeklyView ? "🔄 מעבר לתצוגה חודשית" : "🔄 מעבר לתצוגה שבועית";
    renderCalendar();
});

document.getElementById('exportBtn').addEventListener('click', () => {
    if (Object.keys(events).length === 0) {
        alert("אין אירועים לייצוא!");
        return;
    }

    let icalContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My Calendar App//HE\n";
    
    for (const [dateKey, description] of Object.entries(events)) {
        const [year, month, day] = dateKey.split('-');
        const formattedDate = `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`;
        
        icalContent += "BEGIN:VEVENT\n";
        icalContent += `DTSTART;VALUE=DATE:${formattedDate}\n`;
        icalContent += `SUMMARY:${description}\n`;
        icalContent += "END:VEVENT\n";
    }
    icalContent += "END:VCALENDAR";

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'my_events.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

document.addEventListener('DOMContentLoaded', renderCalendar);