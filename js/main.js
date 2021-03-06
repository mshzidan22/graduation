// Defining classes /////////////////////////////////////////////////////////////////////////////////////////////

class File {

	constructor  () {
		this.file = null;
		this.rows = null;
		this.headers = null;
	}

	handle_file (file) {
		this.file = file;
		this.convert_to_json();
	}

	convert_to_json () {
		let fileReader = new FileReader();
		fileReader.readAsBinaryString(this.file);
		fileReader.onload = (event)=>{
			let data = event.target.result;
			let workbook = XLSX.read(data,{type:"binary"});
			let first_sheet_name = workbook.SheetNames[0];
			this.rows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[first_sheet_name]);
			this.headers = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[first_sheet_name], {raw:true, header:1})[0];
			this.create_students_objects();
		};
	}

	create_students_objects () {
		let rows_length = this.rows.length;
		let row = null;
		for (let i = 0; i < rows_length; i = i +1) {
			row = this.rows[i];
			let student_wishes = this.create_student_wishes(row);
			my_students.add_student(row["الكود"], row["الاسم"], student_wishes, row["حالة النجاح"], row["المجموع"]);
		}
		my_page.dispaly_departments_limits(this.headers.slice(3, 7));
	}

	create_student_wishes (row) {
		let wishes = {};
		for (let i = 3; i < 7; i = i +1) {
			wishes[this.headers[i]] = row[this.headers[i]];
		}
		return wishes;
	}

	get_user_options (user_options_ids) {
		let user_options_ids_length = user_options_ids.length;
		let user_options = [];
		for (let i = 0; i < user_options_ids_length; i = i +1) {
			user_options.push({});
			user_options[i]["department"] = user_options_ids[i]['limited'].replace("_limited", "");
			user_options[i]["limited"] = document.getElementById(user_options_ids[i]['limited']).checked;
			user_options[i]["unlimited"] = document.getElementById(user_options_ids[i]['unlimited']).checked
			user_options[i]["value"] = document.getElementById(user_options_ids[i]['value']).value;
			user_options[i]["population"] = 0;
		}
		return user_options;
	}

	validate_user_options (user_options) {
		let user_options_length = user_options.length;
		for (let i = 0; i < user_options_length; i = i +1) {
			if (user_options[i]["limited"] && !user_options[i]["value"]) {
				document.getElementById("error_modal").click();
				return false;
			}
		}
		return true;
	}

	increase_population (user_options, department) {
		user_options[user_options.indexOf(department)]["population"] += 1;
	}

	distribute (user_options_ids) {
		let user_options = this.get_user_options(user_options_ids);
		let my_students_length  = my_students.length();
		let user_options_length  = user_options.length;
		if (! this.validate_user_options(user_options)) return false;
		my_students.sort_students();

		for (let i = 0; i < my_students_length; i = i +1) {
			let student = my_students.get_student(i);
			for (let j = 1; j <= user_options_length; j = j +1) {
				let department = user_options.find(function (element) {return element.department == student.get_student_wish(j);})
				if (department["unlimited"]) {
					student["department"] = department["department"];
					this.increase_population(user_options, department);
					break;
				}
				if (department["limited"]) {
					if (department["population"] >= Number(department["value"])) {
						continue;
					} else {
						student["department"] = department["department"];
						this.increase_population(user_options, department);
						break;
					}
				}
			}
		}

		my_page.dispaly_tables(user_options);
	}

}

class Student {

	constructor (id, name, wishes, status, marks)
	{
		this.id = id;
		this.name = name;
		this.wishes = wishes;
		this.status = status;
		this.marks = marks;
		this.department = null;
	}

	get_student_wish (i) {
		let wishes_keys = Object.keys(this.wishes)
		let wishes_length = wishes_keys.length;
		for (let j = 0; j < wishes_length; j = j +1) {
			if (this.wishes[wishes_keys[j]] == i) return  wishes_keys[j];
		}
	}

}

class Students {

	constructor ()
	{
		this.students_list = [];
	}

	add_student (id, name, wish_list, status, marks) {
		this.students_list.push(new Student(id, name, wish_list, status, marks));
	}

	sort_students () {
		let success_students = this.students_list.filter(student => student.status == "ناجح");
		let failure_students = this.students_list.filter(student => student.status != "ناجح");
		success_students.sort(function(a, b){return b['marks'] - a['marks']});
		failure_students.sort(function(a, b){return b['marks'] - a['marks']});
		this.students_list = success_students.concat(failure_students);
	}

	get_student (i) {
		return this.students_list[i];
	}

	length () {
		return this.students_list.length;
	}
}

class Page {
	constructor () {
		this.start_page =  `<div class="row margin-top-15">
								<div class="col-2"></div>
								<div class="col-8">
									<div class="jumbotron">
										<h1 class="center">Students Distribution</h1>      
										<p style="text-align: center">
											Upload the excel sheet containing the students, their marks and their wish list.
										</p>
										<input class="inputfile" type="file" name="file" id="file">
										<label class="inputlabel center" for="file">Choose an excel file</label>
									</div>
								</div>
								<div class="col-2"></div>
							</div>`;
		this.departments_limits = ` <div class="row margin-top-15">
										<div class="col-2"></div>
										<div class="col-8">
											<div class="jumbotron">
												<h1 class="center" style="margin-bottom: 2vh;">Students Distribution</h1>      
												<div class="list-group" style="text-align: right;">
													__DEPARTMENTS__
												</div>
												<label class="inputlabel center" for="file" style="margin-top: 3vh; font-size: 1.5rem;" id="file">Distribute</label>
											</div>
										</div>
										<div class="col-2"></div>
									</div>`
		this.table = `  <table class="table table-dark table-hover">
							<thead>
								<tr>
									__HEADERS__
								</tr>
							</thead>
							<tbody>
								__ROWS__
							</tbody>
						</table>`
	}

	dispaly_start_page () {
		document.getElementsByClassName("conatiner")[0].innerHTML = this.start_page;
	}

	dispaly_departments_limits (departments) {
		let departments_length = departments.length;
		let html_flavors_list = ["primary", "success", "danger", "warning", "info"];
		let html_department = `  <div class="list-group-item list-group-item-action list-group-item-__FLAVOR__ disable-hover-pointer">
									<input type="number"  id="__DEPARTMENT___limited_value" name="__DEPARTMENT___limit_value" disabled>&nbsp;&nbsp;&nbsp;
									<label for="__DEPARTMENT___limited">Limited</label>&nbsp;&nbsp;
									<input type="radio"  class="department_limited" id="__DEPARTMENT___limited" name="__DEPARTMENT___limitation" value="__DEPARTMENT___limited">
									&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
									<label for="__DEPARTMENT___unlimited">Unlimited</label>&nbsp;&nbsp;
									<input type="radio" class="department_unlimited" name="__DEPARTMENT___limitation"  id="__DEPARTMENT___unlimited" value="__DEPARTMENT___unlimited" checked>
									&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
									__DEPARTMENT__
								</div>`;
		let html_departments = "";
		let user_options_ids = [];
		for (let i = 0; i < departments_length; i = i +1) {
			user_options_ids.push({
									"value": departments[i] + "_limited_value", 
									"limited": departments[i] + "_limited",
									"unlimited": departments[i] + "_unlimited"
								});
			html_departments += html_department.replace(/__DEPARTMENT__/g, departments[i]);
			html_departments = html_departments.replace("__FLAVOR__", html_flavors_list[i%5]);
		}
		this.departments_limits = this.departments_limits.replace("__DEPARTMENTS__", html_departments);
	
		document.getElementsByClassName("conatiner")[0].innerHTML = this.departments_limits;

		for (let i = 0; i < departments_length; i = i +1) {
			document.getElementsByClassName('department_limited')[i].addEventListener("change", (event) => {
				document.getElementById(event.target.id.replace("_limited", "") + "_limited_value").disabled = false;
			});
			document.getElementsByClassName('department_unlimited')[i].addEventListener("change", (event) => {
				document.getElementById(event.target.id.replace("_unlimited", "") + "_limited_value").disabled = true;
				document.getElementById(event.target.id.replace("_unlimited", "") + "_limited_value").value = null;
			});
		}

		document.getElementById('file').addEventListener("click", (event) => {
			my_file.distribute(user_options_ids);
		});
	}

	dispaly_tables (user_options) {
		let student_keys = Object.keys(my_students.get_student(0));
		let html_table_header = "";
		let my_students_length = my_students.length();
		let html_table_rows = "";

		let table_header = [];
		let table_rows = [];

		document.getElementById("content_area").innerHTML = "";

		for (let i = 0; i < student_keys.length; i = i +1) {
			if (student_keys[i] == "wishes") {
				for (let k = 0; k < user_options.length; k = k +1) {
					table_header.push(user_options[k]["department"]);
				}
				continue;
			}
			table_header.push(student_keys[i]);
		}

		for (let i = 0; i < my_students_length; i = i +1) {
			table_rows.push("<tr>");
			for (let j = 0; j < student_keys.length; j = j +1) {
				if (student_keys[j] == "wishes") {
					for (let k = 0; k < user_options.length; k = k +1) {
						table_rows.push(my_students.get_student(i)[student_keys[j]][user_options[k]["department"]]);
					}
					continue;
				}
				table_rows.push(my_students.get_student(i)[student_keys[j]]);
			}
			table_rows.push("</tr>");
		}

		for (let j = 0; j < user_options.length; j = j +1) {
			let row = null;
			html_table_header = "";
			html_table_rows = "";

			document.getElementById("content_area").insertAdjacentHTML("beforeend", "<h3 style='text-align: center; margin-top: 3vh;'>" + user_options[j]["department"] + "</h3>");

			for (let i = 0; i < table_rows.length; i = i + table_header.length+2) {
				row = table_rows.slice(i, i+table_header.length+2);
				if (row.find(element => element == user_options[j]["department"]) != undefined){
					for (let k = 0; k < row.length; k = k + 1) {
						if (row[k] == "<tr>" || row[k] == "</tr>") {
							html_table_rows += row[k];
							continue;
						}
						html_table_rows += "<td>" + row[k] + "</td>";	
					}
				}
			}
			let filled_html_table = this.table.replace("__ROWS__", html_table_rows);

			for (let i = 0; i < table_header.length; i = i +1) {
				html_table_header += "<th>" + table_header[i] + "</th>";
			}
			filled_html_table = filled_html_table.replace("__HEADERS__", html_table_header);


			document.getElementById("content_area").insertAdjacentHTML("beforeend", filled_html_table);
		}
	}

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////





// Initializing classes /////////////////////////////////////////////////////////////////////////////////////////////

let my_file = new File();
let my_students = new Students();
let my_page = new Page();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////





// Defining event listeners /////////////////////////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", () => {

	my_page.dispaly_start_page();

	document.getElementById('file').addEventListener("change", (event) => {
		my_file.handle_file(file = event.target.files[0]);
	});
	
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////