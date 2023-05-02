select date(CreaionDate) d , count(*) as posts, sum(viewCount) as views from posts
where CreaionDate between {{query.startDate}} and {{query.endDate}}
group by d
order by d