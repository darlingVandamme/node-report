select Country.Code, Country.Name, Country.Population, Country.Capital, group_concat(City.Name SEPARATOR ", ") as Cities
from Country
inner join City on City.CountryCode = Country.Code
where Country.Name like {{query.countrycontains}}
group by Country.Code, Country.Name, Country.Population, Country.Capital