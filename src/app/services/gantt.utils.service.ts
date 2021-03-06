import {Injectable} from '@angular/core';
import {IInputOptions, IItem, IItems} from '../component/gantt/gantt.component.interface';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class GanttUtilsService {

  constructor() {
  }

  public generateProjects(): IItems {

    const myColors: Array<string> = ['orange', 'blue', 'red', 'green'];

    let projectData: IItems;
    projectData = {};

    for (let j = 0; j < 120; j++) {

      for (let i = 1; i < Math.floor(Math.random() * 10) + 1; i++) {

        let project: IItem;
        project = {
          name: `Project ${j}${i} `,
          color: myColors[Math.floor(Math.random() * 4)],
          date: {
            from: moment('04-04-2019 09:45', 'DD-MM-YYYY HH:mm').toDate(),
            to: moment('06-04-2019 14:30', 'DD-MM-YYYY HH:mm').toDate()
          },
          genealogyDegree: 1,
          collapsed: false,
          itemsChildren: {},
          links: []
        };

        for (let k = 1; k < 3; k++) {
          let task: IItem;
          task = {
            name: `Task ${j}${i}${k}`,
            color: '#ff9a2e',
            progress: 100,
            date: {
              from: moment('05-04-2019', 'DD-MM-YYYY').toDate(),
              to: moment('06-04-2019', 'DD-MM-YYYY').toDate()
            },
            genealogyDegree: 2,
            collapsed: false
          };

          project.itemsChildren[`Task${j}${i}${k}`] = task;
          project.links.push(
            {
              data: task
            }
          );

          for (let l = 1; l < 3; l++) {
            let projectChild: IItem;
            projectChild = {
              name: `Project 1º Filho ${j}${i}${k}${l}`,
              color: '#5eff2e',
              date: {
                from: moment('05-04-2019 12:45', 'DD-MM-YYYY HH:mm').toDate(),
                to: moment('08-04-2019 14:30', 'DD-MM-YYYY HH:mm').toDate()
              },
              genealogyDegree: 2,
              collapsed: false,
              itemsChildren: {}
            };

            project.itemsChildren[`Project1Filho${j}${i}${k}${l}`] = projectChild;

            let projectChildTwo: IItem;
            projectChildTwo = {
              name: `Project 2º Filho ${j}${i}${k}`,
              color: '#5eff2e',
              date: {
                from: moment('05-04-2019 11:15', 'DD-MM-YYYY HH:mm').toDate(),
                to: moment('10-04-2019 14:30', 'DD-MM-YYYY HH:mm').toDate()
              },
              genealogyDegree: 3,
              collapsed: false,
              itemsChildren: {}
            };

            if (k % 2 === 0) {
              project.itemsChildren[`Project1Filho${j}${i}${k}${l}`].itemsChildren[`Project2Filho${j}${i}${k}`] = projectChildTwo;
            }
          }
        }

        projectData[`Project${j}${i}`] = project;
      }
    }

    return projectData;
  }

  public generateInputOptions(): IInputOptions {
    return {
      viewScale: 360,
      editScale: 60,
      range: {
        from: moment('04-04-2019 00:00', 'DD-MM-YYYY HH:mm').toDate(), // moment('00:00', 'HH:mm').subtract(5, 'days').toDate();
        to: moment('08-04-2019 00:00', 'DD-MM-YYYY HH:mm').toDate() // moment('00:00', 'HH:mm').add(5, 'days').toDate();
      }
    };
  }
}
