const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const db = new sqlite3.Database('./timeline.db', (err) => {
    if (err) {
        console.error('データベース接続エラー:', err.message);
    } else {
        console.log('SQLiteデータベースに接続しました');
        initDatabase();
    }
});

function initDatabase() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS persons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time TEXT NOT NULL,
            person_id INTEGER,
            location_id INTEGER,
            action TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (person_id) REFERENCES persons (id),
            FOREIGN KEY (location_id) REFERENCES locations (id)
        )`);

        insertInitialData();
    });
}

function insertInitialData() {
    const initialPersons = ['田中太郎', '佐藤花子', '山田次郎', '鈴木美香'];
    const initialLocations = ['リビング', '書斎', '台所', '玄関', '2階', '庭'];

    const insertPerson = db.prepare('INSERT OR IGNORE INTO persons (name) VALUES (?)');
    initialPersons.forEach(person => {
        insertPerson.run(person);
    });
    insertPerson.finalize();

    const insertLocation = db.prepare('INSERT OR IGNORE INTO locations (name) VALUES (?)');
    initialLocations.forEach(location => {
        insertLocation.run(location);
    });
    insertLocation.finalize();
}

app.get('/api/persons', (req, res) => {
    db.all('SELECT id, name FROM persons ORDER BY name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/locations', (req, res) => {
    db.all('SELECT id, name FROM locations ORDER BY name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/persons', (req, res) => {
    const { name } = req.body;
    db.run('INSERT INTO persons (name) VALUES (?)', [name], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: '既に存在する人物名です' });
            } else {
                res.status(500).json({ error: err.message });
            }
            return;
        }
        res.json({ id: this.lastID, name });
    });
});

app.post('/api/locations', (req, res) => {
    const { name } = req.body;
    db.run('INSERT INTO locations (name) VALUES (?)', [name], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: '既に存在する場所名です' });
            } else {
                res.status(500).json({ error: err.message });
            }
            return;
        }
        res.json({ id: this.lastID, name });
    });
});

app.get('/api/events', (req, res) => {
    const query = `
        SELECT e.id, e.time, p.name as person, l.name as location, e.action, e.created_at
        FROM events e
        LEFT JOIN persons p ON e.person_id = p.id
        LEFT JOIN locations l ON e.location_id = l.id
        ORDER BY e.time
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/events', (req, res) => {
    const { time, person, location, action } = req.body;
    
    db.serialize(() => {
        let personId, locationId;
        
        db.get('SELECT id FROM persons WHERE name = ?', [person], (err, personRow) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (personRow) {
                personId = personRow.id;
            } else {
                db.run('INSERT INTO persons (name) VALUES (?)', [person], function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    personId = this.lastID;
                });
            }
            
            db.get('SELECT id FROM locations WHERE name = ?', [location], (err, locationRow) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                if (locationRow) {
                    locationId = locationRow.id;
                } else {
                    db.run('INSERT INTO locations (name) VALUES (?)', [location], function(err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        locationId = this.lastID;
                    });
                }
                
                setTimeout(() => {
                    db.run('INSERT INTO events (time, person_id, location_id, action) VALUES (?, ?, ?, ?)', 
                           [time, personId, locationId, action], function(err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.json({ id: this.lastID, time, person, location, action });
                    });
                }, 100);
            });
        });
    });
});

app.put('/api/events/:id', (req, res) => {
    const { id } = req.params;
    const { time, person, location, action } = req.body;
    
    db.serialize(() => {
        let personId, locationId;
        
        db.get('SELECT id FROM persons WHERE name = ?', [person], (err, personRow) => {
            if (!personRow) {
                db.run('INSERT INTO persons (name) VALUES (?)', [person], function(err) {
                    personId = this.lastID;
                });
            } else {
                personId = personRow.id;
            }
            
            db.get('SELECT id FROM locations WHERE name = ?', [location], (err, locationRow) => {
                if (!locationRow) {
                    db.run('INSERT INTO locations (name) VALUES (?)', [location], function(err) {
                        locationId = this.lastID;
                    });
                } else {
                    locationId = locationRow.id;
                }
                
                setTimeout(() => {
                    db.run('UPDATE events SET time = ?, person_id = ?, location_id = ?, action = ? WHERE id = ?',
                           [time, personId, locationId, action, id], function(err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.json({ id, time, person, location, action });
                    });
                }, 100);
            });
        });
    });
});

app.delete('/api/events/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'イベントが削除されました' });
    });
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('データベース接続を閉じました');
        process.exit(0);
    });
});

app.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました`);
});