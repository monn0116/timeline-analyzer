class TimelineAnalyzer {
    constructor() {
        this.events = [];
        this.persons = [];
        this.locations = [];
        this.editingEventId = null;
        this.apiUrl = 'http://localhost:3000/api';
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadInitialData();
        this.updateTable();
        this.updateLocationFilter();
    }

    bindEvents() {
        const form = document.getElementById('eventForm');
        const locationFilter = document.getElementById('locationFilter');
        const editForm = document.getElementById('editForm');
        const modal = document.getElementById('editModal');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.querySelector('.btn-cancel');
        const deleteBtn = document.querySelector('.btn-delete');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEvent();
        });

        locationFilter.addEventListener('change', () => {
            this.updateTable();
        });

        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateEvent();
        });

        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });

        cancelBtn.addEventListener('click', () => {
            this.closeModal();
        });

        deleteBtn.addEventListener('click', () => {
            this.deleteEvent();
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        this.bindAddButtons();
    }

    bindAddButtons() {
        document.getElementById('addPersonBtn').addEventListener('click', () => {
            this.toggleAddMode('person');
        });

        document.getElementById('addLocationBtn').addEventListener('click', () => {
            this.toggleAddMode('location');
        });

        document.getElementById('editAddPersonBtn').addEventListener('click', () => {
            this.toggleAddMode('editPerson');
        });

        document.getElementById('editAddLocationBtn').addEventListener('click', () => {
            this.toggleAddMode('editLocation');
        });
    }

    toggleAddMode(type) {
        const isEdit = type.startsWith('edit');
        const baseType = isEdit ? type.replace('edit', '').toLowerCase() : type;
        const prefix = isEdit ? 'edit' : '';
        
        const select = document.getElementById(`${prefix ? prefix + baseType.charAt(0).toUpperCase() + baseType.slice(1) : baseType}`);
        const input = document.getElementById(`${prefix ? prefix + baseType.charAt(0).toUpperCase() + baseType.slice(1) : baseType}Input`);
        const btn = document.getElementById(`${prefix ? 'editAdd' + baseType.charAt(0).toUpperCase() + baseType.slice(1) : 'add' + baseType.charAt(0).toUpperCase() + baseType.slice(1)}Btn`);

        if (input.style.display === 'none') {
            select.style.display = 'none';
            input.style.display = 'block';
            input.focus();
            btn.textContent = '追加';
            btn.classList.add('cancel');
        } else {
            if (input.value.trim()) {
                this.addNewOption(baseType, input.value.trim(), isEdit);
            }
            select.style.display = 'block';
            input.style.display = 'none';
            input.value = '';
            btn.textContent = '新規追加';
            btn.classList.remove('cancel');
        }
    }

    async addNewOption(type, name, isEdit = false) {
        try {
            const response = await fetch(`${this.apiUrl}/${type}s`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });

            if (response.ok) {
                const newItem = await response.json();
                if (type === 'person') {
                    this.persons.push(newItem);
                    this.updatePersonSelects();
                } else {
                    this.locations.push(newItem);
                    this.updateLocationSelects();
                }

                const selectId = isEdit ? `edit${type.charAt(0).toUpperCase() + type.slice(1)}` : type;
                document.getElementById(selectId).value = name;
            } else {
                const error = await response.json();
                alert(`エラー: ${error.error}`);
            }
        } catch (error) {
            console.error('API呼び出しエラー:', error);
            alert('サーバーに接続できません');
        }
    }

    async loadInitialData() {
        try {
            const [personsResponse, locationsResponse, eventsResponse] = await Promise.all([
                fetch(`${this.apiUrl}/persons`),
                fetch(`${this.apiUrl}/locations`),
                fetch(`${this.apiUrl}/events`)
            ]);

            this.persons = await personsResponse.json();
            this.locations = await locationsResponse.json();
            this.events = await eventsResponse.json();

            this.updatePersonSelects();
            this.updateLocationSelects();
        } catch (error) {
            console.error('初期データの読み込みエラー:', error);
            alert('サーバーに接続できません。ローカルモードで動作します。');
            this.loadFromStorage();
        }
    }

    updatePersonSelects() {
        const selects = ['person', 'editPerson'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            const currentValue = select.value;
            select.innerHTML = '<option value="">選択してください</option>';
            
            this.persons.forEach(person => {
                const option = document.createElement('option');
                option.value = person.name;
                option.textContent = person.name;
                select.appendChild(option);
            });
            
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }

    updateLocationSelects() {
        const selects = ['location', 'editLocation'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            const currentValue = select.value;
            select.innerHTML = '<option value="">選択してください</option>';
            
            this.locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location.name;
                option.textContent = location.name;
                select.appendChild(option);
            });
            
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }

    async addEvent() {
        const form = document.getElementById('eventForm');
        const formData = new FormData(form);
        
        const eventData = {
            time: formData.get('time'),
            person: formData.get('person'),
            location: formData.get('location'),
            action: formData.get('action')
        };

        try {
            const response = await fetch(`${this.apiUrl}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            });

            if (response.ok) {
                const newEvent = await response.json();
                await this.loadInitialData();
                this.updateTable();
                this.updateLocationFilter();
                form.reset();
            } else {
                const error = await response.json();
                alert(`エラー: ${error.error}`);
            }
        } catch (error) {
            console.error('イベント追加エラー:', error);
            alert('サーバーに接続できません');
        }
    }

    updateLocationFilter() {
        const select = document.getElementById('locationFilter');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">すべての場所</option>';
        
        const uniqueLocations = [...new Set(this.events.map(event => event.location))].filter(Boolean);
        uniqueLocations.sort().forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            select.appendChild(option);
        });
        
        if (currentValue) {
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
        events.forEach(event => {
            if (event.location) locations.add(event.location);
        });
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
                        personDiv.textContent = event.person || '不明';
                        
                        const actionDiv = document.createElement('div');
                        actionDiv.className = 'action-text';
                        actionDiv.textContent = event.action;
                        
                        const editButton = document.createElement('button');
                        editButton.className = 'edit-button';
                        editButton.textContent = '編集';
                        editButton.addEventListener('click', () => {
                            this.openEditModal(event);
                        });
                        
                        eventDiv.appendChild(personDiv);
                        eventDiv.appendChild(actionDiv);
                        eventDiv.appendChild(editButton);
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

    openEditModal(event) {
        this.editingEventId = event.id;
        
        document.getElementById('editTime').value = event.time;
        document.getElementById('editPerson').value = event.person || '';
        document.getElementById('editLocation').value = event.location || '';
        document.getElementById('editAction').value = event.action;
        
        const modal = document.getElementById('editModal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        document.body.style.overflow = '';
        this.editingEventId = null;
    }

    async updateEvent() {
        if (!this.editingEventId) return;
        
        const formData = new FormData(document.getElementById('editForm'));
        const eventData = {
            time: formData.get('time'),
            person: formData.get('person'),
            location: formData.get('location'),
            action: formData.get('action')
        };

        try {
            const response = await fetch(`${this.apiUrl}/events/${this.editingEventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            });

            if (response.ok) {
                await this.loadInitialData();
                this.updateTable();
                this.updateLocationFilter();
                this.closeModal();
            } else {
                const error = await response.json();
                alert(`エラー: ${error.error}`);
            }
        } catch (error) {
            console.error('イベント更新エラー:', error);
            alert('サーバーに接続できません');
        }
    }

    async deleteEvent() {
        if (!this.editingEventId) return;
        
        if (confirm('このデータを削除しますか？')) {
            try {
                const response = await fetch(`${this.apiUrl}/events/${this.editingEventId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    await this.loadInitialData();
                    this.updateTable();
                    this.updateLocationFilter();
                    this.closeModal();
                } else {
                    const error = await response.json();
                    alert(`エラー: ${error.error}`);
                }
            } catch (error) {
                console.error('イベント削除エラー:', error);
                alert('サーバーに接続できません');
            }
        }
    }

    // フォールバック用のローカルストレージ機能
    loadFromStorage() {
        const savedEvents = localStorage.getItem('timelineEvents');
        if (savedEvents) {
            this.events = JSON.parse(savedEvents);
        }
        
        // ローカルストレージからpersonsとlocationsを抽出
        const persons = new Set();
        const locations = new Set();
        this.events.forEach(event => {
            if (event.person) persons.add(event.person);
            if (event.location) locations.add(event.location);
        });
        
        this.persons = Array.from(persons).map(name => ({ name }));
        this.locations = Array.from(locations).map(name => ({ name }));
        
        this.updatePersonSelects();
        this.updateLocationSelects();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TimelineAnalyzer();
});