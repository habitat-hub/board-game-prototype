import { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.renameTable('Images', 'Files');
  await queryInterface.renameColumn('PartProperties', 'imageId', 'fileId');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.renameColumn('PartProperties', 'fileId', 'imageId');
  await queryInterface.renameTable('Files', 'Images');
}
