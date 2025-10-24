SET NAMES 'utf8mb4';

CREATE DATABASE IF NOT EXISTS `stretch` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
GRANT ALL PRIVILEGES ON stretch.* TO 'admin'@'%' with grant option;
GRANT SHOW VIEW ON stretch.* TO 'admin'@'%' with grant option;
FLUSH PRIVILEGES;

USE `stretch`;
