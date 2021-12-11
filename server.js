// dependencies
const mysql = require('mysql2');
const inquirer = require('inquirer')
const consoleTable = require('console.table')
const figlet = require('figlet')

// connect ti database 
const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
});

connection.connect(err => {
    if(err) throw err;
    console.log('connected as id ' + connection.threadId);
    afterConnection();
})

// figlet employee tracker Welcome Image
figlet('Welcome to Employee Manager!!', function(err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log(data)
});

// inquirer prompt 
const userQuestions = () => {
    inquirer.prompt([
        {
            type: 'list',
            name: 'choices',
            message: 'What would you like to do?',
            choices: [
                'View All Employees',
                'Add Employee',
                'Update Employee Role',
                'View All Roles',
                'Add Role',
                'View All Departments',
                'Add Department', 
                'Quit',
            ]
        }
    ])
    .then((answers) => {
        const {choices} = answers;

        if(choices === 'View All Employees') {
            showEmployees();
        }
        if(choices === 'Add Employee') {
            addEmployee();
        }
        if(choices === 'Update Employee Role') {
            updateEmployee();
        }
        if(choices === 'View All Roles') {
            showRoles();
        }
        if(choices === 'Add Role') {
            addRole();
        }
        if(choices === 'View All Departents') {
            showDepartments();
        }
        if(choices === 'Add Department') {
            addDepartment();
        }
        if(choices === 'Quit') {
            connection.end();
        };
    });
};

// show all employees
showEmployees = () => {
    console.log('Showing all employees');
    const sql = `SELECT employee.id, 
                employee.first_name,
                employee.last_name,
                role.title,
                department.name AS department
                role.salary,
                CONCAT (manager.first_name, "", manager.last_name) AS manager FROM employee
                LEFT JOIN role ON employee.role_id = role.id
                LEFT JOIN department ON role.department_id = department.id
                LEFT JOIN employee manager ON employee.manager_id = manager.id`;

    connection.promise().query(sql, (err, rows) => {
        if(err) throw err;
        console.tables(rows);
        userQuestions();
     })
}

addEmployee = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'firstName',
            message: 'What is the employee\'s first name?',
            validate: addFirst => {
                if(addFirst) {
                    return true;
                } else {
                    console.log('Please enter a first name');
                    return false;
                }
            } 
        },
        {
            type: 'input',
            name: 'lastName',
            message: 'What is the employee\'s last name?',
            validate: addLast => {
                if(addLast) {
                    return true;
                } else {
                    console.log('Please enter a last name');
                    return false;
                }
            }

        }
    ])
    .then(answer => {
        const params = [answer.firstName, answer.lastName]

        // import roles from the role table

        const roleSql = `SELECT role.id, role.title FROM role`;

        connection.promise().query(roleSql, (err, data) => {
            if(err) throw err;

            const roles = data.map(({ id, title }) => ({ name: title, value: id }))

            inquirer.prompt ([
                {
                    type: 'list',
                    name: 'role',
                    message: 'What is the employee\'s role?',
                    choices: roles
                }
            ])
        })
    })
}