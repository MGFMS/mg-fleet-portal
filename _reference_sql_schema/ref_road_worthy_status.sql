--create table [#tempref_road_worthy_status] (
--[Id] [smallint] identity,
--[road_worthy_status] [nvarchar] (50) NULL,
--[description] [nvarchar] (max) NULL,
--[color_coding] [nvarchar] (20) NULL);



set identity_insert [#tempref_road_worthy_status] on;


insert [#tempref_road_worthy_status] ([Id],[road_worthy_status],[description],[color_coding])
select 1,N'Active / Roadworthy',N'In good condition, cleared for use',N'success' UNION ALL
select 2,N'Under Observation',N'Minor issues found but still drivable',N'warning' UNION ALL
select 3,N'Minor Repairs Needed',N'Drivable but requires fixing soon',N'warning' UNION ALL
select 4,N'Unfit for Use / Unroadworthy',N'Failed safety checks',N'danger';

set identity_insert [#tempref_road_worthy_status] off;