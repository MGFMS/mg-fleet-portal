--create table [#tempMechanics] (
--[Id] [smallint] identity,
--[mechanic_name] [nvarchar] (200) NULL,
--[branch_id] [smallint] NULL,
--[added_by] [nvarchar] (50) NULL,
--[date_added] [datetime] NULL,
--[updated_by] [nvarchar] (50) NULL,
--[date_updated] [datetime] NULL,
--[is_active] [smallint] NULL);



set identity_insert [#tempMechanics] on;


insert [#tempMechanics] ([Id],[mechanic_name],[branch_id],[added_by],[date_added],[updated_by],[date_updated],[is_active])
select 1,N'Liam Cruz',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 2,N'Olivia Santos',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 3,N'Noah Reyes',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 4,N'Emma Garcia',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 5,N'Mateo Dela Rosa',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 6,N'Ava Lopez',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 7,N'Lucas Fernandez',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 8,N'Sophia Ramos',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 9,N'Ethan Bautista',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 10,N'Isabella Navarro',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 11,N'James Mendoza',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 12,N'Mia Torres',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 13,N'Benjamin Rivera',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 14,N'Amelia Castillo',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 15,N'Elijah Villanueva',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 16,N'Harper Aquino',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 17,N'Daniel Morales',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 18,N'Aria Delgado',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 19,N'Michael Gonzales',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1 UNION ALL
select 20,N'Charlotte Cruz',1,N'system','2025-10-01 05:35:16.353',NULL,NULL,1;

set identity_insert [#tempMechanics] off;