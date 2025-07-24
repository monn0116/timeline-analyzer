class TimelineAnalyzer {
    constructor() {
        this.events = [];
        this.persons = [];
        this.locations = [];
        this.times = [];
        this.editingEventId = null;
        this.init();
    }

    async init() {
        this.bindEvents();
        this.loadFromStorage();
        this.updatePersonSelects();
        this.updateLocationSelects();
        this.updateTable();
        this.updateLocationFilter();
        this.initMainTabs();
        this.initManagementTabs();
        this.updateManagementLists();
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
        this.bindManagementButtons();
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

    addNewOption(type, name, isEdit = false) {
        const collection = type === 'person' ? this.persons : this.locations;
        
        // 重複チェック
        if (collection.some(item => item.name === name)) {
            alert('既に存在する名前です');
            return;
        }
        
        // 新しいアイテムを追加
        const newItem = { 
            id: Date.now(), 
            name: name,
            created_at: new Date().toISOString()
        };
        
        collection.push(newItem);
        
        // 選択リストを更新
        if (type === 'person') {
            this.updatePersonSelects();
        } else {
            this.updateLocationSelects();
        }
        
        // 追加した項目を選択
        const selectId = isEdit ? `edit${type.charAt(0).toUpperCase() + type.slice(1)}` : type;
        document.getElementById(selectId).value = name;
        
        // ストレージに保存
        this.saveToStorage();
    }

    loadFromStorage() {
        // イベントデータを読み込み
        const savedEvents = localStorage.getItem('timelineEvents');
        if (savedEvents) {
            this.events = JSON.parse(savedEvents);
        }

        // 人物データを読み込み
        const savedPersons = localStorage.getItem('timelinePersons');
        if (savedPersons) {
            this.persons = JSON.parse(savedPersons);
        } else {
            // 初期データ
            this.persons = [
                { id: 1, name: '田中太郎', created_at: new Date().toISOString() },
                { id: 2, name: '佐藤花子', created_at: new Date().toISOString() },
                { id: 3, name: '山田次郎', created_at: new Date().toISOString() },
                { id: 4, name: '鈴木美香', created_at: new Date().toISOString() }
            ];
        }

        // 場所データを読み込み
        const savedLocations = localStorage.getItem('timelineLocations');
        if (savedLocations) {
            this.locations = JSON.parse(savedLocations);
        } else {
            // 初期データ
            this.locations = [
                { id: 1, name: 'リビング', created_at: new Date().toISOString() },
                { id: 2, name: '書斎', created_at: new Date().toISOString() },
                { id: 3, name: '台所', created_at: new Date().toISOString() },
                { id: 4, name: '玄関', created_at: new Date().toISOString() },
                { id: 5, name: '2階', created_at: new Date().toISOString() },
                { id: 6, name: '庭', created_at: new Date().toISOString() }
            ];
        }

        // 時間データを読み込み
        const savedTimes = localStorage.getItem('timelineTimes');
        if (savedTimes) {
            this.times = JSON.parse(savedTimes);
        } else {
            // 初期データ
            this.times = [
                { id: 1, time: '09:00', created_at: new Date().toISOString() },
                { id: 2, time: '10:00', created_at: new Date().toISOString() },
                { id: 3, time: '12:00', created_at: new Date().toISOString() },
                { id: 4, time: '14:00', created_at: new Date().toISOString() },
                { id: 5, time: '16:00', created_at: new Date().toISOString() },
                { id: 6, time: '18:00', created_at: new Date().toISOString() }
            ];
        }
    }

    saveToStorage() {
        localStorage.setItem('timelineEvents', JSON.stringify(this.events));
        localStorage.setItem('timelinePersons', JSON.stringify(this.persons));
        localStorage.setItem('timelineLocations', JSON.stringify(this.locations));
        localStorage.setItem('timelineTimes', JSON.stringify(this.times));
    }

    updatePersonSelects() {
        const selects = ['person', 'editPerson'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            const currentValue = select.value;
            select.innerHTML = '<option value="">選択してください</option>';
            
            this.persons.sort((a, b) => a.name.localeCompare(b.name)).forEach(person => {
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
            
            this.locations.sort((a, b) => a.name.localeCompare(b.name)).forEach(location => {
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

    addEvent() {
        const form = document.getElementById('eventForm');
        const formData = new FormData(form);
        
        const event = {
            id: Date.now(),
            time: formData.get('time'),
            person: formData.get('person'),
            location: formData.get('location'),
            action: formData.get('action'),
            created_at: new Date().toISOString()
        };

        // 新しい人物・場所があれば自動追加
        if (event.person && !this.persons.some(p => p.name === event.person)) {
            this.persons.push({
                id: Date.now() + 1,
                name: event.person,
                created_at: new Date().toISOString()
            });
            this.updatePersonSelects();
        }

        if (event.location && !this.locations.some(l => l.name === event.location)) {
            this.locations.push({
                id: Date.now() + 2,
                name: event.location,
                created_at: new Date().toISOString()
            });
            this.updateLocationSelects();
        }

        this.events.push(event);
        this.saveToStorage();
        this.updateTable();
        this.updateLocationFilter();
        form.reset();
        
        // 入力後に時系列表タブに自動切り替え
        setTimeout(() => {
            this.switchToTab('timeline');
        }, 500);
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

    updateEvent() {
        if (!this.editingEventId) return;
        
        const formData = new FormData(document.getElementById('editForm'));
        const eventIndex = this.events.findIndex(event => event.id === this.editingEventId);
        
        if (eventIndex !== -1) {
            const updatedEvent = {
                ...this.events[eventIndex],
                time: formData.get('time'),
                person: formData.get('person'),
                location: formData.get('location'),
                action: formData.get('action')
            };

            // 新しい人物・場所があれば自動追加
            if (updatedEvent.person && !this.persons.some(p => p.name === updatedEvent.person)) {
                this.persons.push({
                    id: Date.now() + 1,
                    name: updatedEvent.person,
                    created_at: new Date().toISOString()
                });
                this.updatePersonSelects();
            }

            if (updatedEvent.location && !this.locations.some(l => l.name === updatedEvent.location)) {
                this.locations.push({
                    id: Date.now() + 2,
                    name: updatedEvent.location,
                    created_at: new Date().toISOString()
                });
                this.updateLocationSelects();
            }
            
            this.events[eventIndex] = updatedEvent;
            this.saveToStorage();
            this.updateTable();
            this.updateLocationFilter();
            this.closeModal();
        }
    }

    deleteEvent() {
        if (!this.editingEventId) return;
        
        if (confirm('このデータを削除しますか？')) {
            const eventIndex = this.events.findIndex(event => event.id === this.editingEventId);
            
            if (eventIndex !== -1) {
                this.events.splice(eventIndex, 1);
                this.saveToStorage();
                this.updateTable();
                this.updateLocationFilter();
                this.closeModal();
            }
        }
    }

    // メインタブ機能のメソッド
    initMainTabs() {
        const mainTabBtns = document.querySelectorAll('.main-tab-btn');
        const mainTabContents = document.querySelectorAll('.main-tab-content');

        mainTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.mainTab;

                // アクティブなメインタブを切り替え
                mainTabBtns.forEach(b => b.classList.remove('active'));
                mainTabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(`${targetTab}-content`).classList.add('active');

                // タブ切り替え時の特別な処理
                if (targetTab === 'management') {
                    this.updateManagementLists();
                } else if (targetTab === 'timeline') {
                    this.updateTable();
                    this.updateLocationFilter();
                }
            });
        });
    }

    switchToTab(tabName) {
        const mainTabBtns = document.querySelectorAll('.main-tab-btn');
        const mainTabContents = document.querySelectorAll('.main-tab-content');

        // アクティブなメインタブを切り替え
        mainTabBtns.forEach(b => b.classList.remove('active'));
        mainTabContents.forEach(c => c.classList.remove('active'));

        // 新しいタブをアクティブに
        const targetBtn = document.querySelector(`[data-main-tab="${tabName}"]`);
        const targetContent = document.getElementById(`${tabName}-content`);
        
        if (targetBtn && targetContent) {
            targetBtn.classList.add('active');
            targetContent.classList.add('active');

            // タブ切り替え時の特別な処理
            if (tabName === 'management') {
                this.updateManagementLists();
            } else if (tabName === 'timeline') {
                this.updateTable();
                this.updateLocationFilter();
            }
        }
    }

    // 管理機能のメソッド
    initManagementTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;

                // アクティブなタブを切り替え
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
            });
        });
    }

    bindManagementButtons() {
        // 人物管理
        document.getElementById('bulkAddPersons').addEventListener('click', () => {
            this.bulkAddItems('persons');
        });
        document.getElementById('clearPersons').addEventListener('click', () => {
            this.clearAllItems('persons');
        });

        // 場所管理
        document.getElementById('bulkAddLocations').addEventListener('click', () => {
            this.bulkAddItems('locations');
        });
        document.getElementById('clearLocations').addEventListener('click', () => {
            this.clearAllItems('locations');
        });

        // 時間管理
        document.getElementById('bulkAddTimes').addEventListener('click', () => {
            this.bulkAddItems('times');
        });
        document.getElementById('clearTimes').addEventListener('click', () => {
            this.clearAllItems('times');
        });
    }

    bulkAddItems(type) {
        const textareaId = `bulk${type.charAt(0).toUpperCase() + type.slice(0, -1)}s`;
        const textarea = document.getElementById(textareaId);
        const inputText = textarea.value.trim();

        if (!inputText) {
            alert('追加するデータを入力してください');
            return;
        }

        const lines = inputText.split('\n').map(line => line.trim()).filter(line => line);
        const collection = this[type];
        let addedCount = 0;
        let duplicateCount = 0;

        lines.forEach(line => {
            if (type === 'times') {
                // 時間の形式チェック
                if (!/^\d{2}:\d{2}$/.test(line)) {
                    alert(`無効な時間形式です: ${line}\nHH:MM形式で入力してください`);
                    return;
                }
                if (collection.some(item => item.time === line)) {
                    duplicateCount++;
                    return;
                }
                collection.push({
                    id: Date.now() + Math.random(),
                    time: line,
                    created_at: new Date().toISOString()
                });
            } else {
                // 人物・場所の重複チェック
                if (collection.some(item => item.name === line)) {
                    duplicateCount++;
                    return;
                }
                collection.push({
                    id: Date.now() + Math.random(),
                    name: line,
                    created_at: new Date().toISOString()
                });
            }
            addedCount++;
        });

        if (addedCount > 0) {
            this.saveToStorage();
            if (type === 'persons') {
                this.updatePersonSelects();
            } else if (type === 'locations') {
                this.updateLocationSelects();
            }
            this.updateManagementLists();
            textarea.value = '';
        }

        let message = `${addedCount}件のデータを追加しました`;
        if (duplicateCount > 0) {
            message += `\n（${duplicateCount}件は重複のためスキップされました）`;
        }
        alert(message);
    }

    clearAllItems(type) {
        const typeNames = {
            persons: '人物',
            locations: '場所',
            times: '時間'
        };

        if (!confirm(`すべての${typeNames[type]}データを削除しますか？`)) {
            return;
        }

        this[type] = [];
        this.saveToStorage();

        if (type === 'persons') {
            this.updatePersonSelects();
        } else if (type === 'locations') {
            this.updateLocationSelects();
        }

        this.updateManagementLists();
        alert(`すべての${typeNames[type]}データを削除しました`);
    }

    removeItem(type, id) {
        const collection = this[type];
        const index = collection.findIndex(item => item.id === id);
        
        if (index !== -1) {
            collection.splice(index, 1);
            this.saveToStorage();

            if (type === 'persons') {
                this.updatePersonSelects();
            } else if (type === 'locations') {
                this.updateLocationSelects();
            }

            this.updateManagementLists();
        }
    }

    updateManagementLists() {
        this.updatePersonsList();
        this.updateLocationsList();
        this.updateTimesList();
    }

    updatePersonsList() {
        const container = document.getElementById('personsList');
        this.renderItemList(container, this.persons, 'persons', 'name');
    }

    updateLocationsList() {
        const container = document.getElementById('locationsList');
        this.renderItemList(container, this.locations, 'locations', 'name');
    }

    updateTimesList() {
        const container = document.getElementById('timesList');
        this.renderItemList(container, this.times, 'times', 'time');
    }

    renderItemList(container, items, type, displayProperty) {
        if (items.length === 0) {
            container.innerHTML = '<div class="empty-list">データがありません</div>';
            return;
        }

        const sortedItems = items.slice().sort((a, b) => {
            const valueA = a[displayProperty];
            const valueB = b[displayProperty];
            return valueA.localeCompare(valueB);
        });

        container.innerHTML = sortedItems.map(item => `
            <span class="item-tag">
                ${item[displayProperty]}
                <button class="remove-btn" onclick="timelineAnalyzer.removeItem('${type}', ${item.id})">&times;</button>
            </span>
        `).join('');
    }
}

// グローバル変数として参照できるようにする
let timelineAnalyzer;

document.addEventListener('DOMContentLoaded', () => {
    timelineAnalyzer = new TimelineAnalyzer();
});