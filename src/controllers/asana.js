const asana = require('asana');
const converter = require('json-2-csv');
const fs = require('fs'); 
const client = asana.Client.create().useAccessToken(process.env.ASANA_TOKEN);
// const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHET_KEY);

function createCSV (csv, filename) {
  return new Promise(function(resolve, reject) {
    fs.writeFile('csv/'+filename, csv, function(err) {
      if (err) throw err;
      console.log(filename + ' saved');
      resolve();
    });
  });
}

module.exports = {
  async connect (req, res) {
    try {
      let user = await client.users.me()
      const userId = user.gid;
      const workspaceId = user.workspaces[0].gid;
      let projects = await client.projects.getProjects({
        workspace: workspaceId,
        opt_pretty: true
      })
      let tasks = await Promise.all(
        projects.data.map(async project => {
          const tasksByProject = await client.tasks.getTasksForProject(project.gid, {
            opt_pretty: true,
            opt_fields: "gid, name, custom_fields.name, notes, due_on, start_on"
          })
          return tasksByProject.data
        })
      )
      tasks = tasks.reduce((r, e) => (r.push(...e), r), [])

      let subtasks = await Promise.all(
        tasks.map(async task => {
          const subtasksByTask = await client.tasks.getSubtasksForTask(task.gid, {
            opt_fields: "gid, name, notes, parent, due_on, start_on",
            opt_pretty: true
          })
          return subtasksByTask.data
        })
      )
      subtasks = subtasks.reduce((r, e) => (r.push(...e), r), [])

      let taskCSV = await converter.json2csvAsync(tasks, {
        expandArrayObjects: true,
        unwindArrays : true
      })
      let subtaskCSV = await converter.json2csvAsync(subtasks, {
        expandArrayObjects: true,
        unwindArrays : true
      })
      await createCSV(taskCSV, "tasks.csv")
      await createCSV(subtaskCSV, "subtasks.csv")
      return res.status(200).json({
        tasks: tasks,
        subtasks: subtasks
      })
      // return res.status(200).json({
      //   projects: subtasks
      // })
    } catch (err) {
      return res.status(500).json({
        result: false,
        error: err
      })
    }
  }
}