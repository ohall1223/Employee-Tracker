DROP DATABASE IF EXSISTS office_db;
CREATE DATABASE office_db;
USE office_db;

CREATE TABLE department (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL
);

CREATE TABLE role (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(20) NOT NULL,
    salary INT NOT NULL, 
    department_id INT,
    CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE SET NULL
);

CREATE TABLE employee (
    id  INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(20) NOT NULL, 
    last_name VARCHAR(20) NOT NULL,
    role_id INT,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE SET NULL,
    manager_id INT,
    CONSTRAING fk_manager FOREIGN KEY (manager_id) REFERENCES employee(id) ON DELETE SET NULL
);