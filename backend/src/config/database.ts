import sequelize from '../models';
import { setupAssociations } from '../database/associations';

export function connectDatabase() {
  setupAssociations();

  sequelize
    .sync()
    .then(async () => {
      console.log('✅ Database connected successfully');

      try {
        const { initializeDatabaseIfNeeded } = await import(
          '../database/initializer'
        );
        await initializeDatabaseIfNeeded();
        console.log('🚀 Server is ready to accept connections');
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Failed to connect to database:', error);
      process.exit(1);
    });
}
