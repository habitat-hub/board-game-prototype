/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'sequelize-erd' {
  export default function sequelizeErd(
    source: any,
    format?:
      | 'svg'
      | 'dot'
      | 'xdot'
      | 'plain'
      | 'plain-ext'
      | 'ps'
      | 'ps2'
      | 'json'
      | 'json0',
    engine?: 'circo' | 'dot' | 'fdp' | 'neato' | 'osage' | 'twopi',
    arrowShapes?: {
      BelongsToMany: ['crow', 'crow'];
      BelongsTo: ['inv', 'crow'];
      HasMany: ['crow', 'inv'];
      HasOne: ['dot', 'dot'];
    },
    arrowSize?: number,
    lineWidth?: number,
    color?: string,
    include?: string[]
  ): Promise<string>;
}
