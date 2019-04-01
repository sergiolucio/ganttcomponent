import {Injectable} from '@angular/core';
import {IProject} from '../component/gantt/gantt.component.interface';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class GanttUtilsService {
  constructor() {
  }

  public generateProject(): Array<IProject> {
    let project1: IProject;
    project1 = {
      id: 'project1',
      name: 'Project 1',
      color: '#5eff2e',
      date: {
        from: moment('22-01-2019', 'dd-mm-yyyy').toDate(),
        to: moment('25-01-2019', 'dd-mm-yyyy').toDate()
      },
      orderList: 1,
      genealogyDegree: 2,
      tasks: [
        {
          id: 'Task1',
          name: 'Task 1',
          color: '#FF0000',
          progress: 100,
          orderList: 1,
          date: {
            from: moment('22-01-2019', 'dd-mm-yyyy').toDate(),
            to: moment('25-01-2019', 'dd-mm-yyyy').toDate()
          },
          dependencies: {},
          genealogyDegree: 1
        }
      ]
    };

    let project2: IProject;
    project2 = {
      id: 'project2',
      name: 'Project 2',
      color: '#ff9a09',
      date: {
        from: moment('20-01-2019', 'dd-mm-yyyy').toDate(),
        to: moment('25-01-2019', 'dd-mm-yyyy').toDate()
      },
      orderList: 2,
      genealogyDegree: 1
    };

    let project3: IProject;
    project3 = {
      id: 'project3',
      name: 'Project 3',
      color: '#2c41ff',
      date: {
        from: moment('18-01-2019', 'dd-mm-yyyy').toDate(),
        to: moment('22-01-2019', 'dd-mm-yyyy').toDate()
      },
      orderList: 3,
      genealogyDegree: 3,
      tasks: [
        {
          id: 'Task2',
          name: 'Task 2',
          color: '#4cc7ff',
          progress: 100,
          orderList: 1,
          date: {
            from: moment('18-01-2019', 'dd-mm-yyyy').toDate(),
            to: moment('20-01-2019', 'dd-mm-yyyy').toDate()
          },
          dependencies: {},
          genealogyDegree: 2
        },
        {
          id: 'Task3',
          name: 'Task 3',
          color: '#55ff8e',
          progress: 100,
          orderList: 1,
          date: {
            from: moment('19-01-2019', 'dd-mm-yyyy').toDate(),
            to: moment('22-01-2019', 'dd-mm-yyyy').toDate()
          },
          dependencies: {},
          genealogyDegree: 2
        }
      ],
      projectChildren: [
        {
          id: 'project4',
          name: 'Project 4',
          color: '#fff31e',
          date: {
            from: moment('20-01-2019', 'dd-mm-yyyy').toDate(),
            to: moment('28-01-2019', 'dd-mm-yyyy').toDate()
          },
          tasks: [
            {
              id: 'Task4',
              name: 'Task 4',
              color: '#d72dff',
              progress: 100,
              orderList: 1,
              genealogyDegree: 1,
              date: {
                from: moment('20-01-2019', 'dd-mm-yyyy').toDate(),
                to: moment('28-01-2019', 'dd-mm-yyyy').toDate()
              },
              dependencies: {}
            }
          ],
          orderList: 5,
          genealogyDegree: 2,
          projectChildren: [
            {
              id: 'project5',
              name: 'Project 5',
              color: '#fff31e',
              date: {
                from: moment('20-01-2019', 'dd-mm-yyyy').toDate(),
                to: moment('28-01-2019', 'dd-mm-yyyy').toDate()
              },
              tasks: [
                {
                  id: 'Task5',
                  name: 'Task 5',
                  color: '#d72dff',
                  progress: 100,
                  orderList: 1,
                  genealogyDegree: 1,
                  date: {
                    from: moment('20-01-2019', 'dd-mm-yyyy').toDate(),
                    to: moment('28-01-2019', 'dd-mm-yyyy').toDate()
                  },
                  dependencies: {}
                }
              ],
              orderList: 6,
              genealogyDegree: 2
            }
          ]
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
