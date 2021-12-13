// dependencies
const mysql = require('mysql2');
const inquirer = require('inquirer')
require('console.table')
const figlet = require('figlet');
const { listenerCount } = require('events');
const { addAbortSignal } = require('stream');



// connect to database 
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'office_db',
});

connection.connect(err => {
    if(err) throw err;
    console.log('connected as id ' + connection.threadId);
    userQuestions();
})

// figlet employee tracker Welcome Image
figlet('Office Manager', function(err, data) {
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
                'Delete Employee',
                'View All Roles',
                'Add Role',
                'Delete Role',
                'View All Departments',
                'Add Department', 
                'Delete Department',
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
        if(choices === 'Delete Employee') {
            deleteEmployee();
        }
        if(choices === 'View All Roles') {
            showRoles();
        }
        if(choices === 'Add Role') {
            addRole();
        }
        if(choices === 'Delete Role') {
            deleteRole();
        }
        if(choices === 'View All Departents') {
            showDepartments();
        }
        if(choices === 'Add Department') {
            addDepartment();
        }
        if(choices === 'Delete Department') {
            deleteDepartment();
        }
        if(choices === 'Quit') {
            connection.end();
        };
    });
};

// show all employees
const showEmployees = () => {
    console.log('Showing all employees');
    const query = `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
    FROM employee
    LEFT JOIN employee manager on manager.id = employee.manager_id
    INNER JOIN role ON (role.id = employee.role_id)
    INNER JOIN department ON (department.id = role.department_id)
    ORDER BY employee.id;`

    connection.query(query, (err, res) => {
        if(err) throw err;
        console.table(res);
        userQuestions();
     })
}

const addEmployee = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'firstName',
            message: 'What is the employee\'s first name?'
        },
        {
            type: 'input',
            name: 'lastName',
            message: 'What is the employee\'s last name?'
        }
    ])
    .then(answer => {
        const params = [answer.firstName, answer.lastName]

        // import roles from the role table

        const roleSql = `SELECT role.id, role.title FROM role`;

        connection.query(roleSql, (err, data) => {
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

                connection.query(managerSql, (err, data) => {
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

                        const sql = `INSERT INTO employee (first_name, last_name, role_id, manager_id)
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
const updateEmployee = () => {
    // import employees from the employee table 
    const employeeSql = `SELECT * FROM employee`;

    connection.query(employeeSql, (err, data) => {
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

            connection.query(roleSql, (err, data) => {
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

// deletes an employee
const deleteEmployee = () => {
    const employeeSql = `SELECT * FROM employee`;

    connection.query(employeeSql, (err, data) => {
        if(err) throw err;

        const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'name',
                message: 'Which employee do you want to delete?',
                choices: employees
            }
        ])
        .then(empChoice => {
            const employee = empChoice.name;

            const sql = `DELETE FROM employee WHERE id = ?`;

            connection.query(sql, employee, (err, result) => {
                if(err) throw err;
                console.log("Employee sucessfully deleted!");

                showEmployees()
            });
        });
    })
}

// show all roles
const showRoles = () => {
    console.log('Showing all roles')

    const sql = `SELECT role.id, role.title, department.name AS department FROM role 
                INNER JOIN department ON role.department_id = department.id`

    connection.query(sql, (err, rows) => {
        if(err) throw err;
        console.table(rows);
        userQuestions()
    })
}

// add a role
const addRole = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'role',
            message: 'What is the name of the role?',
        },
        {
            type: 'input',
            name: 'salary',
            meggage: 'What is the salary of the role?'
        }
    ])
    .then(answer => {
        const params = [answer.role, answer.salary]
        
        const roleSql = `SELECT name, id FROM department`;

        connection.query(roleSql, (err, data) => {
            if(err) throw err;

            const departments = data.map(({ name, id}) => ({ name: name, value: id }))

            inquirer.prompt([
                {
                    type: 'list',
                    name: 'dept',
                    message: 'Which department does the role belong to?',
                    choices: departments
                }
            ])
            .then(deptChoice => {
                const dept = deptChoice.dept
                params.push(dept);

                const sql = `INSERT INTO role (title, salary, department_id)
                            VALUES (?, ?, ?)`;

                connection.query(sql, params, (err, result) => {
                    if (err) throw err;
                    console.log(`${answer.role} sucessfully added to roles!`);

                    showRoles();
                })
            })
        })
    })
}

// delete row
deleteRole = () => {
    const roleSql = `SELECT * FROM role`;

    connection.query(roleSql, (err, data) => {
        if(err) throw err;

        const role = data.map(({ title, id}) => ({ name: title, value: id}));

        inquirer.prompt([
            {
                type: 'list',
                name: 'role',
                message: 'Which role do you want to delete?',
                choices: role
            }
        ])
        .then(roleChoice => {
            const role = roleChoice.role;
            const sql = `DELETE FROM role WHERE id = ?`;

            connection.query(sql, role, (err, result) => {
                if(err) throw err;
                console.log('Role sucessfully deleted!');

                showRoles();
            });
        });
    });
};

// show all departments
const showDepartments = () => {
    console.log(`Showing all departments`)
    const sql = `SELECT department.id AS id, department.name AS department FROM department`
    
    connection.query(sql, (err, rows) =>{
        if(err) throw err;
        console.table(rows);
        userQuestions();
    });
};

// add a department
const addDepartment = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'addDept',
            meggage: 'What is the name of the department?',
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

const deleteDepartment = () => {
    const deptSql = `SELECT * FROM department`;

    connection.query(deptSql, (err, data) => {
        if(err) throw err;

        const dept = data.map(({ name, id }) => ({ name: name, value: id }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'dept',
                message: 'Which department do you want to delete?',
                choices: dept
            }
        ])
        .then(deptChoice => {
            const dept = deptChoice.dept;
            const sql = `DELETE FROM department WHERE id = ?`;

            connection.query(sql, dept, (err, result) => {
                if(err) throw err;
                console.log('Department successfully deleted!');

                showDepartments();
            })
        })
    })
}
