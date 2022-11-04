import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { ModalModule, BsModalService } from 'ngx-bootstrap/modal';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { EmployeeD3OrgChartComponent } from './components/employeechart/employeechart-d3-org-chart/employeechart-d3-org-chart.component';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
	declarations: [
		AppComponent,
		EmployeeD3OrgChartComponent,
	],
	imports: [
		BrowserModule,
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,
		ModalModule.forRoot(),
		BrowserAnimationsModule,
		ToastrModule.forRoot({
			timeOut: 6000,
			positionClass: 'toast-bottom-right',
			preventDuplicates: true,
			progressBar: true
		}),
	],
	providers: [
		BsModalService,
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
