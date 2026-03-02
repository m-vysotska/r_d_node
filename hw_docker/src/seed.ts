const path = require('path');
const { DataSource } = require('typeorm');
const { User } = require('./entities/user.entity');

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ecommerce',
    entities: [path.join(__dirname, 'entities', 'user.entity.js')],
    synchronize: false,
  });
  await ds.initialize();
  const repo = ds.getRepository(User);
  const existing = await repo.count();
  if (existing === 0) {
    await repo.insert([
      { email: 'admin@example.com', name: 'Admin' },
      { email: 'user@example.com', name: 'User' },
    ]);
    console.log('Seed completed: 2 users created');
  } else {
    console.log('Seed skipped: users already exist');
  }
  await ds.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
