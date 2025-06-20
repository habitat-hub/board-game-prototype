import { Model, DataTypes } from 'sequelize';
import sequelize from './index';

/**
 * NOTE:
 * このモデルは、S3 等に保存された物理ファイルとしての画像情報を保持する。
 * - 表示名（displayName）やパス（storagePath）、サイズ、MIMEタイプなどの基本属性を管理する。
 * - このモデルは画像ファイルの「実体」を表し、表示名を除き、アプリ内での表示や・使用に関する情報は持たない。
 */
// 画像を管理
class ImageModel extends Model {
  // ID
  public id!: string;
  // アップロード時のファイル名（ユーザー編集不可）
  public displayName!: string;
  // S3上の物理ファイル名
  public storagePath!: string;
  // MIMEタイプ
  public contentType!: string;
  // ファイルサイズ
  public fileSize!: number;
  // アップロードしたユーザID
  public uploaderUserId!: string;
}

ImageModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    storagePath: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    contentType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    uploaderUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'Image',
    indexes: [
      {
        fields: ['storagePath'],
        unique: true,
      },
    ],
  }
);

export default ImageModel;
