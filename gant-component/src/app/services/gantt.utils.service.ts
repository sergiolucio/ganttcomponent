import {Injectable} from '@angular/core';
import {IProject} from '../component/gantt/gantt.component.interface';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class GanttUtilsService {
  constructor() {
  }

  public generateProjects(): Array<IProject> {
    let project1: IProject;
    project1 = {
      id: 'project1',
      name: 'Project 1',
      color: '#5eff2e',
      date: {
        from: moment('29-03-2019', 'DD-MM-YYYY').toDate(),
        to: moment('5-04-2019', 'DD-MM-YYYY').toDate()
      },
      genealogyDegree: 1,
      collapsed: false,
      tasks: [
        {
          id: 'Task1',
          name: 'Task 1',
          color: '#FF0000',
          progress: 100,
          date: {
            from: moment('30-03-2019', 'DD-MM-YYYY').toDate(),
            to: moment('02-04-2019', 'DD-MM-YYYY').toDate()
          },
          dependencies: {},
          genealogyDegree: 2,
          collapsed: false
        }
      ]
    };

    let project2: IProject;
    project2 = {
      id: 'project2',
      name: 'Project 2',
      color: '#ff9a09',
      date: {
        from: moment('29-03-2019', 'DD-MM-YYYY').toDate(),
        to: moment('25-04-2019', 'DD-MM-YYYY').toDate()
      },
      genealogyDegree: 1,
      collapsed: false
    };

    let project3: IProject;
    project3 = {
      id: 'project3',
      name: 'Project 3',
      color: '#2c41ff',
      date: {
        from: moment('18-03-2019', 'DD-MM-YYYY').toDate(),
        to: moment('22-04-2019', 'DD-MM-YYYY').toDate()
      },
      genealogyDegree: 1,
      collapsed: false,
      tasks: [
        {
          id: 'Task2',
          name: 'Task 2',
          color: '#4cc7ff',
          progress: 100,
          date: {
            from: moment('18-03-2019', 'DD-MM-YYYY').toDate(),
            to: moment('20-04-2019', 'DD-MM-YYYY').toDate()
          },
          dependencies: {},
          genealogyDegree: 2,
          collapsed: false
        },
        {
          id: 'Task3',
          name: 'Task 3',
          color: '#55ff8e',
          progress: 100,
          date: {
            from: moment('19-03-2019', 'DD-MM-YYYY').toDate(),
            to: moment('22-04-2019', 'DD-MM-YYYY').toDate()
          },
          dependencies: {},
          genealogyDegree: 2,
          collapsed: false
        }
      ],
      projectChildren: [
        {
          id: 'project4',
          name: 'Project 4',
          color: '#fff31e',
          date: {
            from: moment('20-03-2019', 'DD-MM-YYYY').toDate(),
            to: moment('28-04-2019', 'DD-MM-YYYY').toDate()
          },
          tasks: [
            {
              id: 'Task4',
              name: 'Task 4',
              color: '#d72dff',
              progress: 100,
              genealogyDegree: 3,
              collapsed: false,
              date: {
                from: moment('20-03-2019', 'DD-MM-YYYY').toDate(),
                to: moment('28-04-2019', 'DD-MM-YYYY').toDate()
              },
              dependencies: {}
            }
          ],
          genealogyDegree: 2,
          collapsed: false,
          projectChildren: [
            {
              id: 'project5',
              name: 'Project 5',
              color: '#ff6357',
              date: {
                from: moment('29-03-2019 09:30', 'DD-MM-YYYY HH:mm').toDate(),
                to: moment('03-04-2019 09:30', 'DD-MM-YYYY HH:mm').toDate()
              },
              tasks: [
                {
                  id: 'Task5',
                  name: 'Task 5',
                  color: '#6f6f6f',
                  progress: 100,
                  genealogyDegree: 4,
                  collapsed: false,
                  date: {
                    from: moment('29-03-2019 12:00', 'DD-MM-YYYY HH:mm').toDate(),
                    to: moment('28-04-2019 09:30', 'DD-MM-YYYY HH:mm').toDate()
                  },
                  dependencies: {}
                }
              ],
              genealogyDegree: 3,
              collapsed: false
            },
            {
              id: 'project8',
              name: 'Project 8',
              color: '#ff6357',
              date : {
                from: moment('20-01-2019', 'DD-MM-YYYY').toDate(),
                to: moment('28-01-2019', 'DD-MM-YYYY').toDate()
              },
              genealogyDegree: 3,
              collapsed: false
            }
          ]
        },
        {
          id: 'project6',
          name: 'Project 6',
          color: '#fff31e',
          date: {
            from: moment('20-01-2019', 'DD-MM-YYYY').toDate(),
            to: moment('28-01-2019', 'DD-MM-YYYY').toDate()
          },
          tasks: [
            {
              id: 'Task6',
              name: 'Task 6',
              color: '#d72dff',
              progress: 100,
              genealogyDegree: 3,
              collapsed: false,
              date: {
                from: moment('20-01-2019', 'DD-MM-YYYY').toDate(),
                to: moment('28-01-2019', 'DD-MM-YYYY').toDate()
              },
              dependencies: {}
            }
          ],
          genealogyDegree: 2,
          collapsed: false,
          projectChildren: [
            {
              id: 'project7',
              name: 'Project 7',
              color: '#ff6357',
              date: {
                from: moment('20-01-2019', 'DD-MM-YYYY').toDate(),
                to: moment('28-01-2019', 'DD-MM-YYYY').toDate()
              },
              tasks: [
                {
                  id: 'Task7',
                  name: 'Task 7',
                  color: '#6f6f6f',
                  progress: 100,
                  genealogyDegree: 4,
                  collapsed: false,
                  date: {
                    from: moment('20-01-2019', 'DD-MM-YYYY').toDate(),
                    to: moment('28-01-2019', 'DD-MM-YYYY').toDate()
                  },
                  dependencies: {}
                }
              ],
              genealogyDegree: 3,
              collapsed: false
            }
          ],
        }

      ]
    };

    let projectData: Array<IProject>;
    projectData = [];

    projectData.push(project1);
    projectData.push(project2);
    projectData.push(project3);

    return projectData;
  }
}
