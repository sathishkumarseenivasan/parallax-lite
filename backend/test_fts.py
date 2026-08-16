import sqlite3
conn = sqlite3.connect(':memory:')
conn.execute('CREATE VIRTUAL TABLE fts USING fts5(a, b)')
conn.execute('INSERT INTO fts(a, b) VALUES("hello", "world")')
print(conn.execute('SELECT count(*) FROM fts').fetchall())
print(conn.execute('SELECT * FROM fts WHERE fts MATCH "hello"').fetchall())
