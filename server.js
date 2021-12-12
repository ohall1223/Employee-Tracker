// dependencies
const mysql = require('mysql2');
const inquirer = require('inquirer')
const consoleTable = require('console.table')
const figlet = require('figlet');
const { listenerCount } = require('events');
const { addAbortSignal } = require('stream');

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
            .then(roleChoice => {
                const role = roleChoice.role;
                params.push(role);

                const managerSql = `SELECT * FROM employee`;

                connection.promise().query(managerSql, (err, data) => {
                    if(err) throw err;

                    const managers = data.map(({ id, first_name, last_name}) => ({ name: first_name + " " + last_name, value: id }));

                    inquirer.prompt ([
                        {
                            type: 'list',
                            name: 'manager',
                            message: 'Who is the employee\'s manager?',
                            choices: managers
                        }
                    ])
                    .then(managerChoice => {
                        const manager = managerChoice.manager;
                        params.push(manager);

                        const sql = `INSERT INTO employee (first_name. last_name, role_id, manager_id)
                        VALUES (?, ?, ?, ?)`;

                        connection.query(sql, params, (err, result) => {
                            if(err) throw err;
                            console.log('Employee sucessfully added!')

                            showEmployees();
                        })
                    })
                })
            })
        })
    })
}

// update an employee
updateEmployee = () => {
    // import employees from the employee table 
    const employeeSql = `SELECT * FROM employee`;

    connection.promise().query(employeeSql, (err, data) => {
        if(err) throw err;

        const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'name',
                message: 'Which employee\'s role do you want to update',
                choices: employees
            }
        ])
        .then(empChoice => {
            const employee = empChoice.name;
            const params = [];
            params.push(employee);

            const roleSql = `SELECT * FROM role`;

            connection.promise().query(roleSql, (err, data) => {
                if(err) throw err;

                const roles = data.map(({ id, title}) => ({ name: title, value: id }))

                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'role',
                        message: 'Which role do you want to assign to the selected employee?',
                        choices: roles
                    }
                ])
                .then(roleChoice => {
                    const role = roleChoice.role;
                    params.push(role);

                    let employee = params[0]
                    params[0] = role
                    params[1] = employee

                    console.log(params)

                    const sql = `UPDATE employee SET role_id = ? WHERE id = ?`;

                    connection.query(sql, params, (err, result) => {
                        if(err) throw err;

                        console.log('Employee sucessfully updated');

                        showEmployees();
                    })
                })
            })
        })
    })
}

// show all roles
showRoles = () => {
    console.log('Showing all roles')

    const sql = `SELECT role.id, role.title, department.name AS department FROM role 
                INNER JOIN department ON role.department_id = department.id`

    connection.promise().query(sql, (err, rows) => {
        if(err) throw err;
        console.table(rows);
        userQuestions()
    })
}

// add a role
addRole = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'role',
            message: 'What is the name of the role?',
            validate: addRole => {
                if(addRole) {
                    return true;
                } else {
                    console.log('Please enter a role');
                    return false;
                }
            }
        },
        {
            type: 'input',
            name: 'salary',
            meggage: 'What is the salary of the role?',
            validate: addSalary => {
                if(isNaN(addSalary)) {
                    return true;
                } else {
                    console.log('Please enter a salary is USD')
                    return false;
                }
            }
        }
    ])
    .then(answer => {
        const params = [answer.role, answer.salary]
        
        const roleSql = `SELECT name, id FROM department`;

        connection.promise().query(roleSql, (err, data) => {
            if(err) throw err;

            const departments = data.map(({ name, id}) => ({ name: name, value: id }))

            inquirer.prompt([
                {
                    type: 'list',
                    name: 'dept',
                    message: 'Which department does the role belong to?',
                    choices: departmemts
                }
            ])
            .then(deptChoice => {
                const dept = deptChoice.dept
                params.push(dept);

                const sql = `INSERT INTO role (title, salar, department_id)
                            VALUES (?, ?, ?)`;

                connection.query(sql, params, (err, result) => {
                    if (err) throw err;
                    console.log(`${answer.role} sucessfullt added to roles!`);

                    showRoles();
                })
            })
        })
    })
}

// show all departments
showDepartments = () => {
    console.log(`Showing all departments`)
    const sql = `SELECT department.id AS id, department.name AS department FROM department`
    
    connection.promise().query(sql, (err, rows) =>{
        if(err) throw err;
        console.table(rows);
        userQuestions();
    });
};

// add a department
addDepartment = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'addDept',
            meggage: 'What is the name of the department?',
            validate: addDept => {
                if(addDept) {
                    return true;
                } else {
                    console.log('Please enter a department name');
                    return false;
                }
            }
        }
    ])
    .then(answer => {
        const sql = `INSERT INTO department (name)
                    VALUES (?)`;
        connection.query(sql, answer.addDept, (err, result) => {
            if(err) throw err;
            console.log(`${answer.addDept} sucessfully added to departments!`);

            showDepartments();
        })
    })
}