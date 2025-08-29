import { Sequelize } from 'sequelize';

declare module 'sequelize-erd' {
  interface ErdOptions {
    source: Sequelize;
    format?:
      | 'svg'
      | 'dot'
      | 'xdot'
      | 'plain'
      | 'plain-ext'
      | 'ps'
      | 'ps2'
      | 'json'
      | 'json0';
    engine?: 'circo' | 'dot' | 'fdp' | 'neato' | 'osage' | 'twopi';
    arrowShapes?: {
      BelongsToMany: ['crow', 'crow'];
      BelongsTo: ['inv', 'crow'];
      HasMany: ['crow', 'inv'];
      HasOne: ['dot', 'dot'];
    };
    arrowSize?: number;
    lineWidth?: number;
    color?: string;
    include?: string[];
  }

  export default function sequelizeErd(options: ErdOptions): Promise<string>;
}
