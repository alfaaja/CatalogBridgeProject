# Screen Inventory

## P0

1. Login (if auth enabled)
2. Dashboard
3. Import Product
4. Import Progress / Result state
5. Products List
6. Product Review / Detail
7. Shopee Preview / Mapping
8. History / Activity
9. Generic Not Found / Error surface

## P1

10. Batch Import
11. Settings — only if real settings such as markup defaults exist
12. Export result/download state

## Shared components

- app sidebar/header;
- page header;
- product thumbnail/name cell;
- status indicator;
- currency display;
- product gallery;
- review checklist;
- field issue alert;
- loading/progress indicator;
- empty state;
- confirmation dialog;
- toast notifications;
- technical details disclosure panel.

Do not build a shared component until at least one real screen needs it. Prefer existing shadcn primitives.
