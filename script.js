class TimelineAnalyzer {
    constructor() {
        this.events = [];
        this.locations = new Set();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadFromStorage();
        this.updateTable();
        this.updateLocationFilter();
    }

    bindEvents() {
        const form = document.getElementById('eventForm');
        const locationFilter = document.getElementById('locationFilter');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEvent();
        });

        locationFilter.addEventListener('change', () => {
            this.updateTable();
        });
    }

    addEvent() {
        const form = document.getElementById('eventForm');
        const formData = new FormData(form);
        
        const event = {
            id: Date.now(),
            time: formData.get('time'),
            person: formData.get('person'),
            location: formData.get('location'),
            action: formData.get('action')
        };

        this.events.push(event);
        this.locations.add(event.location);
        this.saveToStorage();
        this.updateTable();
        this.updateLocationFilter();
        form.reset();
    }

    updateLocationFilter() {
        const select = document.getElementById('locationFilter');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">すべての場所</option>';
        
        Array.from(this.locations).sort().forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            select.appendChild(option);
        });
        
        if (currentValue && this.locations.has(currentValue)) {
            select.value = currentValue;
        }
    }

    updateTable() {
        const filteredEvents = this.getFilteredEvents();
        const timeSlots = this.getTimeSlots(filteredEvents);
        const locationList = this.getFilteredLocations(filteredEvents);
        
        this.renderTableHeader(locationList);
        this.renderTableBody(timeSlots, locationList, filteredEvents);
    }

    getFilteredEvents() {
        const locationFilter = document.getElementById('locationFilter').value;
        
        if (!locationFilter) {
            return this.events;
        }
        
        return this.events.filter(event => event.location === locationFilter);
    }

    getFilteredLocations(events) {
        const locations = new Set();
        events.forEach(event => locations.add(event.location));
        return Array.from(locations).sort();
    }

    getTimeSlots(events) {
        const times = new Set();
        events.forEach(event => times.add(event.time));
        return Array.from(times).sort();
    }

    renderTableHeader(locations) {
        const header = document.getElementById('tableHeader');
        header.innerHTML = '<th>時間</th>';
        
        locations.forEach(location => {
            const th = document.createElement('th');
            th.textContent = location;
            header.appendChild(th);
        });
    }

    renderTableBody(timeSlots, locations, events) {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';

        if (timeSlots.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = locations.length + 1;
            cell.textContent = 'データがありません';
            cell.className = 'empty-cell';
            row.appendChild(cell);
            tbody.appendChild(row);
            return;
        }

        timeSlots.forEach(time => {
            const row = document.createElement('tr');
            
            const timeCell = document.createElement('td');
            timeCell.textContent = this.formatTime(time);
            timeCell.className = 'time-cell';
            row.appendChild(timeCell);
            
            locations.forEach(location => {
                const cell = document.createElement('td');
                const eventsInCell = events.filter(event => 
                    event.time === time && event.location === location
                );
                
                if (eventsInCell.length > 0) {
                    eventsInCell.forEach(event => {
                        const eventDiv = document.createElement('div');
                        eventDiv.className = 'event-info';
                        
                        const personDiv = document.createElement('div');
                        personDiv.className = 'person-name';
                        personDiv.textContent = event.person;
                        
                        const actionDiv = document.createElement('div');
                        actionDiv.className = 'action-text';
                        actionDiv.textContent = event.action;
                        
                        eventDiv.appendChild(personDiv);
                        eventDiv.appendChild(actionDiv);
                        cell.appendChild(eventDiv);
                    });
                } else {
                    cell.className = 'empty-cell';
                    cell.textContent = '-';
                }
                
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });
    }

    formatTime(time) {
        const [hours, minutes] = time.split(':');
        return `${hours}:${minutes}`;
    }

    saveToStorage() {
        localStorage.setItem('timelineEvents', JSON.stringify(this.events));
        localStorage.setItem('timelineLocations', JSON.stringify(Array.from(this.locations)));
    }

    loadFromStorage() {
        const savedEvents = localStorage.getItem('timelineEvents');
        const savedLocations = localStorage.getItem('timelineLocations');
        
        if (savedEvents) {
            this.events = JSON.parse(savedEvents);
        }
        
        if (savedLocations) {
            this.locations = new Set(JSON.parse(savedLocations));
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TimelineAnalyzer();
});