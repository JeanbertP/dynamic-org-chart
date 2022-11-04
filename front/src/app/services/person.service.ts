import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { PersonCriteria } from '../model/PersonCriteria';
import { BehaviorSubject, Observable } from 'rxjs';
import { Person } from '../model/Person';


@Injectable({
	providedIn: 'root'
})
export class PersonService {

	private criteria$ = new BehaviorSubject<PersonCriteria>(null);
	private PersonsInProgress$ = new BehaviorSubject<Person[]>(null);

	private urlApi: string;

	constructor(private http: HttpClient) {
		this.urlApi = `${environment.apiUrl}/api/`;
	}

	public searchPersons(criteria: PersonCriteria, pageNumber: number, maxResults: number): Observable<any> {
		return this.http.get<any>(`${this.urlApi}persons?name=${criteria.name}&surname=${criteria.surname}`);
	}

	public getPersonByBadgeId(badgeId: string): Observable<Person> {
		return this.http.get<Person>(`${this.urlApi}persons/badgeId?badgeId=${badgeId}`);
	}

	public getPersonsByManager(badgeId: string): Observable<Person[]> {
		return this.http.get<Person[]>(`${this.urlApi}persons/manager?badgeId=${badgeId}&pageNumber=0&maxResults=100`);
	}

	public getAvatar(badgeId: string): Observable<any> {
		let httpHeaders = new HttpHeaders({
			'Accept': 'image/*, application/json',
			'Cache-Control': 'no-cache',
		});
		return this.http.get(`${this.urlApi}persons/avatar?badgeId=${badgeId}`,
			{
				headers: httpHeaders,
				responseType: 'blob',
				observe: 'response',
			}
		);

	}


}
