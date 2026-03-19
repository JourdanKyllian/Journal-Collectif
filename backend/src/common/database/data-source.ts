import {
  DataSource,
  DataSourceOptions
} from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: 'journal',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'], 
  migrations: ['src/common/database/migrations/*.ts'],
  synchronize: false, 
  logging: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;