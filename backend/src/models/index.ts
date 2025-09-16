import { Sequelize } from 'sequelize';
import env from '../config/env';
import {
  DB_POOL_MAX,
  DB_POOL_MIN,
  DB_POOL_ACQUIRE,
  DB_POOL_IDLE,
} from '../constants/database';
import { withNeonTransactionPooler } from '../helpers/databaseUrl';

const connectionString = withNeonTransactionPooler(
  env.DATABASE_URL,
  env.NODE_ENV
);

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  pool: {
    max: DB_POOL_MAX,
    min: DB_POOL_MIN,
    acquire: DB_POOL_ACQUIRE,
    idle: DB_POOL_IDLE,
  },
});

export default sequelize;
