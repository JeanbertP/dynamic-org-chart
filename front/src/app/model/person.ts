import { Address } from './address';
import { Job } from './job';
import { Unit } from './unit';

export class Person {
	public badgeId: string;
	public name: string;
	public surname: string;
	public type: string;
	public internalMail: string;
	public externalMail: string;
	public tel: string;
	public mobile: string;
	public tower: string;
	public floor: string;
	public manager: Person;
	public assistant: String;
	public unitId: string;
	public job: Job;
	public address: Address;
	public unit: Unit;
}