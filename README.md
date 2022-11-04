# dynamic-org-chart
OrgChart (based on d3-org-chart) with REST calls to build step-by-step the tree

This example constructs the tree with dynamic calls (REST api with a node server). 
When you click on the "+" icon, search, load and refresh the tree
When you click on a node, a modal displays information about the employee
When you click on the up node, the manager is retrieved and add to the tree as new root

Employees are sorted according to their jobs.
Avatars are downloaded through server api. You can simplify with direct url calls.

Sorry for the minimal sample data but it's boring to fill ... :-)
For search functionnality, search with the person called Dalton

Enjoy to copy, reuse, enhance, fork, ...

# usage
run back server : in the back directory => node simpleserver.js
run front server : in the front directory => ng serve
