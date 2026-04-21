--create table [#tempref_problem_occur_types] (
--[Id] [smallint] identity,
--[occur_type] [nvarchar] (200) NULL);



set identity_insert [#tempref_problem_occur_types] on;


insert [#tempref_problem_occur_types] ([Id],[occur_type])
select 1,N'DURING HIGH SPEED' UNION ALL
select 2,N'DURING SLOW DOWN' UNION ALL
select 3,N'DURING ENGINE START' UNION ALL
select 4,N'DURING COLD START';

set identity_insert [#tempref_problem_occur_types] off;