
import { Component, Input, ViewChild, ElementRef, HostListener, TemplateRef, AfterViewInit } from '@angular/core';
import { take } from 'rxjs/operators';

import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';

import { OrgChart } from 'd3-org-chart';
import * as d3 from 'd3';
import { jsPDF } from 'jspdf';

import { environment } from 'src/environments/environment';

import { Person } from 'src/app/model/Person';
import { PersonService } from 'src/app/services/Person.service';
import { PersonCriteria } from 'src/app/model/PersonCriteria';


@Component({
    selector: 'app-employee-d3-org-chart',
    templateUrl: './employeechart-d3-org-chart.component.html',
    styleUrls: ['./employeechart-d3-org-chart.component.scss']
})
export class EmployeeD3OrgChartComponent implements AfterViewInit {
    chart = null;
    public loading = false; // top to display the backdrop
    @Input() topRootId = '46309416'; // root id (ie bigboss' badgeId)
    @ViewChild('chartContainer') chartContainer: ElementRef;
    @ViewChild('PersonModalTemplate') PersonModalTemplate: TemplateRef<any>;
    @ViewChild('name') inputNom: ElementRef;
    data: any[];
    public layoutDirection = 0; // top, left, ...
    public compact = 0; // compact or default arrangement

    //Search Modal
    bsModalRef: BsModalRef;
    searchPanel = false; // Display modal 
    public employeeName = 'Dalton'; // criteria field for modal search
    public employeeSurname = ''; // criteria field for modal search
    public searchedEmployees = []; // Persons retrieved from request according criteria
    currentPerson = {}; // Person à afficher dans la modale


    /** ***
     Handler : nodeClickHandler
     Parameters :
     Description : Handler set on graphical nodes to deal features icons (go up in tree parenthood, retrieve children, dispaly detail modal)
                   In render function, css classes are set on icons to able to the handler to deal actions
     Detail :
        - if class node-button-foreign-object is set, nothing to do : standard behaviour expand/collapse 
        - if class node-button-retrieve ("+" icon), call to the dynamical children search (if they are not yet retrieved and loaded)
        - if class node-button-parent (icone"Î"), call to the parent retrieving
    */
    nodeClickHandler = (event, node) => {
        if ([...event.srcElement.classList].includes('node-button-foreign-object')) {
        } else if ([...event.srcElement.classList].includes('node-button-retrieve') && (node.data.hasChildren == null)) {
            // click on "+" icon
            // added class on icon in render()
            this.retrieveChildren(node);
        } else if ([...event.srcElement.classList].includes('node-button-parent')) {
            // click on "go up" icon
            // added class on icon in render()
            // the gotten father becomes the new root of the tree; the old father becomes one of the children
            this.getParent(node);
        } else {  // click on the node surface
            this.viewEmployee(node);
        }
    };

    constructor(
        private toastr: ToastrService,
        private modalService: BsModalService,
        private PersonService: PersonService,
    ) {
    }

    @HostListener('window:resize', ['$event'])
    onResize(event): void {
        this.updateChart();
    }

    ngAfterViewInit() {
        // To avoid error : ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked
        setTimeout(() => this.ngAfterViewInit2(), 0);
    }

    async ngAfterViewInit2() {
        if (!this.chart) {
            this.chart = new OrgChart();
        }
        await this.loadEmployeeAndChildren(this.topRootId);
        setTimeout(() => { this.updateChart(); }, 1000);
    }

    /** ***
    Function : updateChart
    Parameters :
    Description : Définition des caractéristiques des éléments du graphes
    Note : Fonction appelée par le handler sur le noeud
    Detail :
        - verify that the chart object and data are ok
        - set chart options
        - define paint function for node
    */
    async updateChart() {
        if (!this.data) { return; }
        if (!this.chart) { return; }
        const self = this;
        this.chart
            .container(this.chartContainer.nativeElement)
            .data(this.data)
            .svgWidth(window.innerWidth /* *.6 */ - 10)  // 60% -5px for right margin et -5px for left margin
            .svgHeight(window.innerHeight - 5) // height - 5 for margin
            .nodeWidth(d => 300)
            .nodeHeight(d => 120)
            .initialZoom(0.7)
            .compact(this.compact)
            .childrenMargin((d) => 40)
            .compactMarginBetween((d) => 50)
            .compactMarginPair((d) => 50)
            .neightbourMargin((a, b) => 50)
            .siblingsMargin((d) => 100)
            .nodeUpdate((d, i, arr) => {  // set the handler
                d3.select(arr[i]).on('click.node-update', this.nodeClickHandler);
            })
            .nodeContent(function (d, i, arr, state) {
                const text1 = d.data.surname + ' ' + d.data.name;
                const text2 = d.data.job || '';
                const text3 = '';
                const text4 = d.data.unit || '';
                const avatar = d.data.avatar;

                //some color according jobs
                let bgcolor = 'whitesmoke';
                let color = 'black';
                if (d.data.job) {
                    if (d.data.job.startsWith('Assistant')) {
                        bgcolor = 'aliceblue';
                    } else
                        if (d.data.job.startsWith('Director') || d.data.job.startsWith('CEO')) {
                            bgcolor = '#1179c3';
                            color = 'white';
                        } else if (d.data.job.startsWith('manager')) {
                            bgcolor = '#3AB6E3';
                            color = 'white';
                        }
                }
                // Displays "Up" icon if the node is the tree root except if it's already the dataroot (the big boss) or if the parent is already in the whole tree (managerId=parentId)
                // Displays "+" icon if retrieving not yet done
                return `
                 <div class='a' style="width:${d.width}px;height:${d.height}px;margin-top: 00px">
                    ${(d.data.managerId != null && d.data.managerId !== d.data.parentId && d.data.id !== self.topRootId) ? `<div class="node-button-parent" style="position:absolute;top:-15px;right:-15px;color:white;background-color:lightgrey;font-size:24px;border-radius:50px;width:30px;height:30px">
                        <div class="node-button-parent" style="text-align: center;"><i class="node-button-parent bi bi-arrow-bar-up"></i></div>
                    </div>` : ``}
                    <div style="padding-top:10px;background-color:navy;margin-left:1px;border-radius:2px;overflow:visible">
                    <div style="height:${d.height - 10}px;padding: 5px;background-color:${bgcolor};color:${color};border:1px solid lightgray;display:flex;flex-direction:column;justify-content:space-between">
                    <div style="border-radius:50px;position:absolute;left:-15px;top:-15px;background-color:gray;width:75px;height:75px;">
                    <img style="position:absolute;left:2px;top:2px;border-radius:50px;height:70px;width:70px" src="${avatar}" onerror="this.src='/assets/images/avatar_unknown.svg'">
                    </div>

                            <div style="display:flex;flex-direction:column;text-align:center">
                                <div style="color:${color};font-size:16px;font-weight:bold">${text1}</div>
                                <div style="color:${color};font-size:14px;font-weight:bold">${text2}</div>
                                <div style="color:${color};font-size:12px;font-weight:normal">${text3}</div>
                                <div style="color:${color};font-size:12px;font-weight:bold">&nbsp;</div>
                                <div style="color:${color};font-size:12px;font-weight:bold">${text4}</div>
                            </div>
                            <div style="display:flex;justify-content:space-between;"></div>
                        </div>
                    </div>

                    ${(d.data.hasChildren != null) ? `` : `
                    <div class='node-button-retrieve' style="position:absolute;top:${d.height - 15}px;left:${d.width / 2 - 15}px;background-color:lightgrey;border-radius:50px;width:30px;height:30px;">
                    <div class='node-button-retrieve' style="font-size: x-large;text-align: center;">
                    +
                    </div>
                    </div>`}
                 </div>
                `;
            })
            .render();
    }

    /** ***
    Function : viewEmployee
    Parameters : node = current node
    Description : Dysplays the information modal on the current employee
    Note : Function called by the handler on the current node
    */
    viewEmployee(node) {
        try {
            this.currentPerson = {};
            this.loading = true;
            this.PersonService.getPersonByBadgeId(node.data.id).subscribe((pers) => {
                let PersonModalTemplate: TemplateRef<any>;
                this.currentPerson = pers;
                this.bsModalRef = this.modalService.show(this.PersonModalTemplate);
                this.loading = false;
            });
        } catch (err) {
            this.toastr.error("Error on retreiving the person's data");
        }
        finally {
            this.loading = false;
        }
    }

    /** ***
    Function : getParent
    Parameters : n = current node
    Description : Search for the parent to set it as the new root and attach the current tree
    Note : Function called by the handler on the current node
    Detail :
        - copies data in a temp data (cannot work on data directly as it's impossible to have several root)
        - calls the API to retreive the father on the actual root
        - points the root on the father
        - Set the father as new root
        - assign the temp data to data
    */
    async getParent(n) {
        try {
            this.loading = true;
            const data2 = [...this.data];
            const manager: Person = await this.PersonService.getPersonByBadgeId(n.data.managerId).pipe<Person>(take(1)).toPromise<Person>();
            if (manager == null) { this.loading = false; return; }
            const newroot = {
                id: manager.badgeId,
                name: manager.name,
                surname: manager.surname,
                job: manager.job?.text ?? '',
                unit: manager.unit?.name ?? '',
                parentId: null,
                managerId: manager.manager?.badgeId ?? null,
                hasChildren: true,
                avatar: null
            };
            newroot.avatar = await this.getAvatar(newroot);
            n.data.parentId = n.data.managerId; // on reporte le manager dans le parentId dans l'ancien root
            data2.push(newroot);
            this.data = [...data2];
            this.loading = false;

            await this.getChildren(newroot);
            setTimeout(() => { this.updateChart(); }, 1000);
        } catch (err) {
            this.toastr.error('Erreur de récupération du manager');
        }
        finally {
            this.loading = false;
        }
    }

    /** ***
    Function : retrieveChildren
    Parameters : n = current node
    Description : Retrieve potential childrenand attach them to the current node
    Note : Function called by the handler on the current node
    Detail :
        - calls to getChildren()
        - Refresh the tree, centers it and expand it
    */
    async retrieveChildren(n) {
        await this.getChildren(n.data);
        // Workaround pour expand the subtree :
        //   1) Via timeout to exit the refresh loop and allow repaint
        //   2) Select a children node
        //   3) do setExpanded
        setTimeout(() => {
            this.updateChart();
            const _children = this.data.filter(elt => elt.parentId === n.data.id);
            if (_children && _children.length > 0) {
                this.chart.setCentered(n.data.id).setExpanded(_children[0].id).render();
            }
        }, 1000);
    }

    /** ***
    Function : getChildren
    Parameters : datanodepere = data bloc of the father
    Description : Retrieve children (if exist)
    Detail :
        - call to the API
        - set flad indicating there is (or not) children for this node
        - attach the children in data. Previously, it's tested that the child is not yet present in the whole tree to not generate a "duplicate error"
    */
    async getChildren(fatherdatanode) {
        try {
            this.loading = true;
            const collabs = await this.PersonService.getPersonsByManager(fatherdatanode.id).pipe<any>(take(1)).toPromise<any>();
            fatherdatanode.hasChildren = false; // met a jour comme quoi le pere a des fils (false par défaut pour différentier de null)
            if (collabs.content !== undefined) {
                collabs.content.forEach(async (coll: Person) => {
                    fatherdatanode.hasChildren = true; // met a jour comme quoi le pere a des fils
                    // Verifie que l'employe n'est pas déjà présent dans l'arbre
                    if (this.data.find((elt: any) => elt.id === coll.badgeId) === undefined) {
                        let employeeNode = {
                            id: coll.badgeId,
                            name: coll.name,
                            surname: coll.surname,
                            job: coll.job?.text ?? '',
                            unit: coll.unit?.name ?? '',
                            jobusage: '',
                            parentId: fatherdatanode.id,
                            managerId: fatherdatanode.id, // comme le parentId mais necessaire quand on fait une recherche : le parent null dans le Orgchart car c'est le root mais il faut stocker le manager pour remonter dans l'arborescence
                            hasChildren: null,
                            avatar: ""
                        };
                        this.data.push(employeeNode);
                        employeeNode.avatar = await this.getAvatar(employeeNode);
                    }
                });
                this.sortjob();
            }
        } catch (err) {
            fatherdatanode.hasChildren = false;
            this.toastr.error('Erreur de récupération des employees');
        }
        finally {
            this.loading = false;
        }
    }

    /** ***
    Function : loadEmployeeAndChildren
    Parameters : employeebadgeId = badgeId of the Person
    Description : Search for Person and his employee
    Note : Function called by the search modal
    Detail :
        - call to getPersonByBadgeId et create node
        - appel de getChildren pour récupérer les enfants
        - refresh
    */
    async loadEmployeeAndChildren(employeebadgeId: string) {
        try {
            this.data = [];
            this.loading = true;
            const employee: Person = await this.PersonService.getPersonByBadgeId(employeebadgeId).pipe<Person>(take(1)).toPromise<Person>();
            const employeeNode = {
                id: employee.badgeId,
                name: employee.name,
                surname: employee.surname,
                job: employee.job?.text ?? '',
                unit: employee.unit?.name ?? '',
                managerId: employee.manager?.badgeId ?? null, // equal to parentId but it's necessay to perform a search : the "parent" of the root is null in the chart but one's have to store the real manager (parent) to go up in the data tree
                parentId: null, // null as it becomes the new root
                hasChildren: null, // we don't know yet
                avatar: ""
            };
            this.data = [];
            this.data.push(employeeNode);
            employeeNode.avatar = await this.getAvatar(employeeNode);
            await this.getChildren(employeeNode);
            this.loading = false;
        } catch (err) {
            this.toastr.error('Error on retrieving information about the employee');
        }
        finally {
            this.loading = false;
        }
    }

    /** ***
    Function : search
    Parameters :
    Description : REtrieve a person by name and/or surname
    Note : Function called by the search modal
    Detail :
        - criteria validation test 
        - call to the search api
        - if line number=0, displays an error
        - if line number=1, close the modal and load info about the person and his directes employees (via loadEmployeeAndChildren)
        - if line number>1, displays the lsit of persons (click on a line to lauch loadEmployeeAndChildren)
    */
    search() {
        const criteria: PersonCriteria = new PersonCriteria();

        if (this.employeeSurname === '' || this.employeeName === '') {
            this.toastr.error('Please fill Name and surname');
            return;
        }

        criteria.name = this.employeeName;
        criteria.surname = this.employeeSurname;
        this.PersonService.searchPersons(criteria, 0, 99).subscribe((res) => {
            if (res.totalElements === 0) {
                this.toastr.error('No known employee');
            } else if (res.totalElements === 1) {
                this.onClickEmployeeInListSearchModal(res.content[0].badgeId);
            } else {
                this.searchedEmployees = res.content;
            }
        },
            error => {
                this.closeEmployeesSearchModal();
                this.toastr.error('Error on the employee search');
            }
        );
    }

    /** ***
     Function : onClickEmployeeInListSearchModal
     Parameters : badgeId
     Description : launch the person in the list
     */
    onClickEmployeeInListSearchModal(badgeId) {
        this.closeEmployeesSearchModal();
        this.loadEmployeeAndChildren(badgeId);
        setTimeout(() => { this.updateChart(); this.chart.render().expandAll(); }, 1000);
    }

    /** ***
     Function : openEmployeesSearchModal
     Parameters :
     Description : open the modal
     Detail : set the searchPanel flag
     */
    openEmployeesSearchModal() {
        this.searchedEmployees = [];
        this.searchPanel = true;
        setTimeout(() => { this.inputNom.nativeElement.focus(); }, 0);
    }

    /** ***
     Function : openEmployeesSearchModal
     Parameters :
     Description : close the modal
     Detail : set the searchPanel flag
     */
    closeEmployeesSearchModal() {
        this.searchPanel = false;
    }

    /** ***
     Function : setDirectionTree
     Parameters :
     Description : set the display
     Detail :
        - call to the native d3-org-chart function
     */
    setDirectionTree() {
        this.chart.layout(['right', 'bottom', 'left', 'top'][(this.layoutDirection++) % 4]).render().fit();
    }

    /** ***
     Function : exportToSvg
     Parameters :
     Description : call the native png generation
     Note : Fonction appelée par la barre d'outil
     Detail :
        - call to the native d3-org-chart function
     */
    exportToSvg() {
        const { svg } = this.chart.getChartState();
        this.chart.fit();
        setTimeout(() => {
            this.chart.downloadImage({ full: true, node: svg.node(), scale: 3, isSvg: true });
        }, 1000);
    }

    /** ***
     Function : exportToPdf
     Parameters :
     Description : call the native pdf generation
     Note : Fonction appelée par la barre d'outil
     Detail :
        - call to the native d3-org-chart function
        - call to the native pdfjs function
     */
    exportToPdf() {
        this.loading = true;
        this.chart.exportImg({
            full: true,
            save: false,
            onLoad: (base64) => {
                const pdf = new jsPDF('l', 'mm', 'a4');
                const img = new Image();
                img.src = base64;
                img.onload = () => {
                    pdf.addImage(
                        img,
                        'JPEG',
                        0,
                        0,
                        pdf.internal.pageSize.getWidth(),
                        img.height / img.width * pdf.internal.pageSize.getWidth(),
                        '',
                        'NONE'
                    );
                    pdf.save('chart.pdf');
                    this.loading = false;
                };
            },
        });
    }

    /** ***
     Function : sortjob
     Parameters :
     Description : sort employees according their jobs (CEO -> Director -> xxx -> Assistant) then alpha order on the name
     Detail :
    */
    sortjob() {
        this.data.sort((a, b) => (a.job <= b.job) ? -1 : 0);
        this.data.sort((a, b) => {
            if (a.job.startsWith('CEO') && (!b.job.startsWith('CEO'))) {
                return -1;
            }
            if (a.job.startsWith('Director') && !b.job.startsWith('Director')) {
                return -1;
            }

            if (a.job.startsWith('Assistant') || b.job.startsWith('Assistant')) {
                return -1;
            }
            return 0;
        });
        this.data.sort((a, b) => (a.job !== b.job) ? 0 : (a.name <= b.name) ? -1 : 0);
    }

    async getAvatar(datanode) {
        // equivalent to : environment.apiUrl + "/" + datanode.id + ".png"
        try {
            let res = await this.PersonService.getAvatar(datanode.id).pipe<any>(take(1)).toPromise<any>();
            datanode.avatar = await this.blobToBase64Async(res.body);
            return datanode.avatar;

        } catch (e) {
            datanode.avatar = "";
            return datanode.avatar;
        }
    }

    async blobToBase64Async(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onerror = (e) => reject(fileReader.error);
            fileReader.onloadend = (e) => {
                const dataUrl = fileReader.result as string;
                resolve(dataUrl);
            };
            fileReader.readAsDataURL(blob);
        });
    }
} // END OF COMPONENT
