import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: 'journal',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  migrations: [],
  synchronize: false,
  logging: false,
};

const dataSource = new DataSource({
  ...dataSourceOptions,
  migrations: ['src/common/database/migrations/*.ts'],
});

export default dataSource;
