import { Component, Input, OnInit } from '@angular/core';


@Component({
    selector: 'fs-month-divider',
    templateUrl: './month-divider.component.html',
    styleUrls: ['./month-divider.component.scss'],
    standalone: true
})
export class FsMonthDividerComponent implements OnInit {

  @Input()
  public monthName: string = null;

  constructor() { }

  public ngOnInit() {
  }

}
