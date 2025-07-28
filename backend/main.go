package main

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Estructuras de datos para la API
type Property struct {
	SerialNumber    int64   `json:"serial_number"`
	ListYear        int     `json:"list_year"`
	DateRecorded    string  `json:"date_recorded"`
	Town            string  `json:"town"`
	Address         string  `json:"address"`
	AssessedValue   float64 `json:"assessed_value"`
	SaleAmount      float64 `json:"sale_amount"`
	SalesRatio      float64 `json:"sales_ratio"`
	PropertyType    string  `json:"property_type"`
	ResidentialType string  `json:"residential_type"`
	YearsUntilSold  int     `json:"years_until_sold"`
}

type TownAnalytics struct {
	Town         string  `json:"town"`
	AveragePrice float64 `json:"average_price"`
	Count        int     `json:"count"`
}

type PropertyTypeAnalytics struct {
	PropertyType  string  `json:"property_type"`
	Count         int     `json:"count"`
	AveragePrice  float64 `json:"average_price"`
	AvgSalesRatio float64 `json:"avg_sales_ratio"`
}

type YearlyAnalytics struct {
	Year          int     `json:"year"`
	TotalSales    int     `json:"total_sales"`
	AveragePrice  float64 `json:"average_price"`
	AvgSalesRatio float64 `json:"avg_sales_ratio"`
}

type SalesRatioAnalytics struct {
	Range      string  `json:"range"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

type TimeToSellAnalytics struct {
	Range      string  `json:"range"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

func main() {
	// Conexión a la base de datos
	connStr := "postgresql://user_urbanytics:password_urbanytics@localhost:5432/db_urbanytics"
	pool, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Configuración del servidor
	router := gin.Default()
	router.Use(cors.Default())

	// Endpoint de prueba
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// Endpoint de prueba para verificar filtros
	router.GET("/test-filter", func(c *gin.Context) {
		propertyType := c.Query("property_type")

		if propertyType == "" {
			c.JSON(200, gin.H{"message": "No filter provided", "property_type": ""})
			return
		}

		var count int
		err := pool.QueryRow(context.Background(),
			"SELECT COUNT(*) FROM properties WHERE property_type = $1",
			propertyType).Scan(&count)

		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, gin.H{
			"message":       "Filter applied successfully",
			"property_type": propertyType,
			"count":         count,
		})
	})

	// Endpoints CRUD para propiedades
	router.POST("/properties", func(c *gin.Context) {
		var newProperty Property
		if err := c.BindJSON(&newProperty); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request body"})
			return
		}
		sql := "INSERT INTO properties (serial_number, town, sale_amount, property_type) VALUES ($1, $2, $3, $4)"
		_, err := pool.Exec(context.Background(), sql, newProperty.SerialNumber, newProperty.Town, newProperty.SaleAmount, newProperty.PropertyType)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create property", "details": err.Error()})
			return
		}
		c.JSON(201, newProperty)
	})

	// Listar propiedades con filtros avanzados y paginación
	router.GET("/properties", func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit

		town := c.Query("town")
		minPrice := c.Query("min_price")
		maxPrice := c.Query("max_price")
		propertyType := c.Query("property_type")
		residentialType := c.Query("residential_type")
		listYear := c.Query("list_year")
		minSalesRatio := c.Query("min_sales_ratio")
		maxSalesRatio := c.Query("max_sales_ratio")
		minYearsUntilSold := c.Query("min_years_until_sold")
		maxYearsUntilSold := c.Query("max_years_until_sold")

		sortBy := c.DefaultQuery("sort_by", "serial_number")
		sortOrder := c.DefaultQuery("sort_order", "asc")

		baseQuery := "SELECT serial_number, list_year, date_recorded, town, address, assessed_value, sale_amount, sales_ratio, property_type, residential_type, years_until_sold FROM properties"
		var conditions []string
		var args []interface{}
		argId := 1

		if town != "" {
			conditions = append(conditions, fmt.Sprintf("town ILIKE $%d", argId))
			args = append(args, "%"+town+"%")
			argId++
		}
		if minPrice != "" {
			conditions = append(conditions, fmt.Sprintf("sale_amount >= $%d", argId))
			args = append(args, minPrice)
			argId++
		}
		if maxPrice != "" {
			conditions = append(conditions, fmt.Sprintf("sale_amount <= $%d", argId))
			args = append(args, maxPrice)
			argId++
		}
		if propertyType != "" {
			conditions = append(conditions, fmt.Sprintf("property_type = $%d", argId))
			args = append(args, propertyType)
			argId++
		}
		if residentialType != "" {
			conditions = append(conditions, fmt.Sprintf("residential_type = $%d", argId))
			args = append(args, residentialType)
			argId++
		}
		if listYear != "" {
			conditions = append(conditions, fmt.Sprintf("list_year = $%d", argId))
			args = append(args, listYear)
			argId++
		}
		if minSalesRatio != "" {
			conditions = append(conditions, fmt.Sprintf("sales_ratio >= $%d", argId))
			args = append(args, minSalesRatio)
			argId++
		}
		if maxSalesRatio != "" {
			conditions = append(conditions, fmt.Sprintf("sales_ratio <= $%d", argId))
			args = append(args, maxSalesRatio)
			argId++
		}
		if minYearsUntilSold != "" {
			conditions = append(conditions, fmt.Sprintf("years_until_sold >= $%d", argId))
			args = append(args, minYearsUntilSold)
			argId++
		}
		if maxYearsUntilSold != "" {
			conditions = append(conditions, fmt.Sprintf("years_until_sold <= $%d", argId))
			args = append(args, maxYearsUntilSold)
			argId++
		}

		whereClause := ""
		if len(conditions) > 0 {
			whereClause = " WHERE " + strings.Join(conditions, " AND ")
		}

		countQuery := fmt.Sprintf("SELECT COUNT(*) FROM properties%s", whereClause)
		var totalCount int
		err := pool.QueryRow(context.Background(), countQuery, args...).Scan(&totalCount)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to count properties", "details": err.Error()})
			return
		}

		validSortFields := map[string]string{
			"serial_number":    "serial_number",
			"sale_amount":      "sale_amount",
			"list_year":        "list_year",
			"sales_ratio":      "sales_ratio",
			"years_until_sold": "years_until_sold",
			"town":             "town",
			"property_type":    "property_type",
			"residential_type": "residential_type",
		}

		if _, valid := validSortFields[sortBy]; !valid {
			sortBy = "serial_number"
		}

		if sortOrder != "asc" && sortOrder != "desc" {
			sortOrder = "asc"
		}

		finalQuery := fmt.Sprintf("%s%s ORDER BY %s %s LIMIT $%d OFFSET $%d", baseQuery, whereClause, sortBy, strings.ToUpper(sortOrder), argId, argId+1)
		args = append(args, limit, offset)

		properties := []Property{}
		rows, err := pool.Query(context.Background(), finalQuery, args...)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query properties", "details": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var p Property
			err := rows.Scan(&p.SerialNumber, &p.ListYear, &p.DateRecorded, &p.Town, &p.Address, &p.AssessedValue, &p.SaleAmount, &p.SalesRatio, &p.PropertyType, &p.ResidentialType, &p.YearsUntilSold)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan property"})
				return
			}
			properties = append(properties, p)
		}

		totalPages := (totalCount + limit - 1) / limit
		c.JSON(200, gin.H{
			"data": properties,
			"pagination": gin.H{
				"current_page": page,
				"total_pages":  totalPages,
				"total_count":  totalCount,
				"limit":        limit,
				"offset":       offset,
			},
		})
	})

	// Obtener propiedad por ID
	router.GET("/properties/:id", func(c *gin.Context) {
		id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
		var p Property
		err := pool.QueryRow(context.Background(), "SELECT serial_number, town, sale_amount, property_type FROM properties WHERE serial_number = $1", id).Scan(&p.SerialNumber, &p.Town, &p.SaleAmount, &p.PropertyType)
		if err != nil {
			if err == pgx.ErrNoRows {
				c.JSON(404, gin.H{"error": "Property not found"})
				return
			}
			c.JSON(500, gin.H{"error": "Internal server error"})
			return
		}
		c.JSON(200, p)
	})

	// Actualizar propiedad por ID
	router.PUT("/properties/:id", func(c *gin.Context) {
		id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
		var updatedProperty Property
		_ = c.BindJSON(&updatedProperty)
		sql := "UPDATE properties SET town = $1, sale_amount = $2, property_type = $3 WHERE serial_number = $4"
		tag, _ := pool.Exec(context.Background(), sql, updatedProperty.Town, updatedProperty.SaleAmount, updatedProperty.PropertyType, id)
		if tag.RowsAffected() == 0 {
			c.JSON(404, gin.H{"error": "Property not found"})
			return
		}
		c.JSON(200, updatedProperty)
	})

	// Eliminar propiedad por ID
	router.DELETE("/properties/:id", func(c *gin.Context) {
		id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
		tag, _ := pool.Exec(context.Background(), "DELETE FROM properties WHERE serial_number = $1", id)
		if tag.RowsAffected() == 0 {
			c.JSON(404, gin.H{"error": "Property not found"})
			return
		}
		c.JSON(200, gin.H{"message": "Property deleted successfully"})
	})

	// Endpoints de analíticas

	// Precios promedio por ciudad
	router.GET("/analytics/avg-price-by-town", func(c *gin.Context) {
		propertyType := c.Query("property_type")

		baseQuery := "SELECT town, AVG(sale_amount) as average_price, COUNT(*) as count FROM properties"

		var conditions []string
		var args []interface{}
		argId := 1

		if propertyType != "" {
			conditions = append(conditions, fmt.Sprintf("property_type = $%d", argId))
			args = append(args, propertyType)
			argId++
		}

		whereClause := ""
		if len(conditions) > 0 {
			whereClause = " WHERE " + strings.Join(conditions, " AND ")
		}

		finalQuery := fmt.Sprintf("%s%s GROUP BY town ORDER BY town", baseQuery, whereClause)

		analyticsData := []TownAnalytics{}
		rows, err := pool.Query(context.Background(), finalQuery, args...)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query analytics", "details": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var data TownAnalytics
			err := rows.Scan(&data.Town, &data.AveragePrice, &data.Count)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan analytics data"})
				return
			}
			analyticsData = append(analyticsData, data)
		}
		c.JSON(200, analyticsData)
	})

	// Análisis por tipo de propiedad
	router.GET("/analytics/property-type-analysis", func(c *gin.Context) {
		propertyType := c.Query("property_type")

		if propertyType != "" {
			rows, err := pool.Query(context.Background(), `
				SELECT 
					property_type,
					COUNT(*) as count,
					AVG(sale_amount) as average_price,
					AVG(sales_ratio) as avg_sales_ratio
				FROM properties 
				WHERE property_type = $1
				GROUP BY property_type
			`, propertyType)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to query property type analytics", "details": err.Error()})
				return
			}
			defer rows.Close()

			var analyticsData []PropertyTypeAnalytics
			for rows.Next() {
				var data PropertyTypeAnalytics
				err := rows.Scan(&data.PropertyType, &data.Count, &data.AveragePrice, &data.AvgSalesRatio)
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to scan property type analytics"})
					return
				}
				analyticsData = append(analyticsData, data)
			}
			c.JSON(200, analyticsData)
			return
		}

		rows, err := pool.Query(context.Background(), `
			SELECT 
				property_type,
				COUNT(*) as count,
				AVG(sale_amount) as average_price,
				AVG(sales_ratio) as avg_sales_ratio
			FROM properties 
			WHERE property_type IS NOT NULL
			GROUP BY property_type 
			ORDER BY count DESC
		`)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query property type analytics", "details": err.Error()})
			return
		}
		defer rows.Close()

		var analyticsData []PropertyTypeAnalytics
		for rows.Next() {
			var data PropertyTypeAnalytics
			err := rows.Scan(&data.PropertyType, &data.Count, &data.AveragePrice, &data.AvgSalesRatio)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan property type analytics"})
				return
			}
			analyticsData = append(analyticsData, data)
		}
		c.JSON(200, analyticsData)
	})

	// Tendencias anuales
	router.GET("/analytics/yearly-trends", func(c *gin.Context) {
		propertyType := c.Query("property_type")

		baseQuery := `
			SELECT 
				list_year,
				COUNT(*) as total_sales,
				AVG(sale_amount) as average_price,
				AVG(sales_ratio) as avg_sales_ratio
			FROM properties 
			WHERE list_year IS NOT NULL`

		var conditions []string
		var args []interface{}
		argId := 1

		if propertyType != "" {
			conditions = append(conditions, fmt.Sprintf("property_type = $%d", argId))
			args = append(args, propertyType)
			argId++
		}

		whereClause := ""
		if len(conditions) > 0 {
			whereClause = " AND " + strings.Join(conditions, " AND ")
		}

		finalQuery := fmt.Sprintf("%s%s GROUP BY list_year ORDER BY list_year", baseQuery, whereClause)

		rows, err := pool.Query(context.Background(), finalQuery, args...)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query yearly trends", "details": err.Error()})
			return
		}
		defer rows.Close()

		var analyticsData []YearlyAnalytics
		for rows.Next() {
			var data YearlyAnalytics
			err := rows.Scan(&data.Year, &data.TotalSales, &data.AveragePrice, &data.AvgSalesRatio)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan yearly trends"})
				return
			}
			analyticsData = append(analyticsData, data)
		}
		c.JSON(200, analyticsData)
	})

	// Distribución de ratio de venta
	router.GET("/analytics/sales-ratio-distribution", func(c *gin.Context) {
		propertyType := c.Query("property_type")

		baseQuery := `
			WITH ratio_ranges AS (
				SELECT 
					CASE 
						WHEN sales_ratio < 0.5 THEN '< 50%'
						WHEN sales_ratio < 0.7 THEN '50-70%'
						WHEN sales_ratio < 0.9 THEN '70-90%'
						WHEN sales_ratio < 1.1 THEN '90-110%'
						WHEN sales_ratio < 1.3 THEN '110-130%'
						ELSE '> 130%'
					END as range_category,
					COUNT(*) as count
				FROM properties 
				WHERE sales_ratio > 0`

		var conditions []string
		var args []interface{}
		argId := 1

		if propertyType != "" {
			conditions = append(conditions, fmt.Sprintf("property_type = $%d", argId))
			args = append(args, propertyType)
			argId++
		}

		whereClause := ""
		if len(conditions) > 0 {
			whereClause = " AND " + strings.Join(conditions, " AND ")
		}

		finalQuery := fmt.Sprintf("%s%s GROUP BY range_category", baseQuery, whereClause)
		finalQuery += `)
			SELECT 
				range_category,
				count,
				ROUND((count * 100.0 / SUM(count) OVER ()), 2) as percentage
			FROM ratio_ranges
			ORDER BY 
				CASE range_category
					WHEN '< 50%' THEN 1
					WHEN '50-70%' THEN 2
					WHEN '70-90%' THEN 3
					WHEN '90-110%' THEN 4
					WHEN '110-130%' THEN 5
					ELSE 6
				END`

		rows, err := pool.Query(context.Background(), finalQuery, args...)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query sales ratio distribution", "details": err.Error()})
			return
		}
		defer rows.Close()

		var analyticsData []SalesRatioAnalytics
		for rows.Next() {
			var data SalesRatioAnalytics
			err := rows.Scan(&data.Range, &data.Count, &data.Percentage)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan sales ratio distribution"})
				return
			}
			analyticsData = append(analyticsData, data)
		}
		c.JSON(200, analyticsData)
	})

	// Distribución de tiempo hasta venta
	router.GET("/analytics/time-to-sell-distribution", func(c *gin.Context) {
		propertyType := c.Query("property_type")

		baseQuery := `
			WITH time_ranges AS (
				SELECT 
					CASE 
						WHEN years_until_sold = 0 THEN 'Venta inmediata'
						WHEN years_until_sold <= 1 THEN '1 año o menos'
						WHEN years_until_sold <= 3 THEN '1-3 años'
						WHEN years_until_sold <= 5 THEN '3-5 años'
						WHEN years_until_sold <= 10 THEN '5-10 años'
						ELSE 'Más de 10 años'
					END as time_range,
					COUNT(*) as count
				FROM properties 
				WHERE years_until_sold >= 0`

		var conditions []string
		var args []interface{}
		argId := 1

		if propertyType != "" {
			conditions = append(conditions, fmt.Sprintf("property_type = $%d", argId))
			args = append(args, propertyType)
			argId++
		}

		whereClause := ""
		if len(conditions) > 0 {
			whereClause = " AND " + strings.Join(conditions, " AND ")
		}

		finalQuery := fmt.Sprintf("%s%s GROUP BY time_range", baseQuery, whereClause)
		finalQuery += `)
			SELECT 
				time_range,
				count,
				ROUND((count * 100.0 / SUM(count) OVER ()), 2) as percentage
			FROM time_ranges
			ORDER BY 
				CASE time_range
					WHEN 'Venta inmediata' THEN 1
					WHEN '1 año o menos' THEN 2
					WHEN '1-3 años' THEN 3
					WHEN '3-5 años' THEN 4
					WHEN '5-10 años' THEN 5
					ELSE 6
				END`

		rows, err := pool.Query(context.Background(), finalQuery, args...)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query time to sell distribution", "details": err.Error()})
			return
		}
		defer rows.Close()

		var analyticsData []TimeToSellAnalytics
		for rows.Next() {
			var data TimeToSellAnalytics
			err := rows.Scan(&data.Range, &data.Count, &data.Percentage)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan time to sell distribution"})
				return
			}
			analyticsData = append(analyticsData, data)
		}
		c.JSON(200, analyticsData)
	})

	// Top 10 ciudades por volumen
	router.GET("/analytics/top-cities-by-volume", func(c *gin.Context) {
		propertyType := c.Query("property_type")

		baseQuery := `
			SELECT 
				town,
				COUNT(*) as total_sales,
				AVG(sale_amount) as average_price,
				SUM(sale_amount) as total_volume
			FROM properties 
			WHERE town IS NOT NULL`

		var conditions []string
		var args []interface{}
		argId := 1

		if propertyType != "" {
			conditions = append(conditions, fmt.Sprintf("property_type = $%d", argId))
			args = append(args, propertyType)
			argId++
		}

		whereClause := ""
		if len(conditions) > 0 {
			whereClause = " AND " + strings.Join(conditions, " AND ")
		}

		finalQuery := fmt.Sprintf("%s%s GROUP BY town ORDER BY total_sales DESC LIMIT 10", baseQuery, whereClause)

		rows, err := pool.Query(context.Background(), finalQuery, args...)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query top cities", "details": err.Error()})
			return
		}
		defer rows.Close()

		var analyticsData []gin.H
		for rows.Next() {
			var town string
			var totalSales int
			var averagePrice, totalVolume float64
			err := rows.Scan(&town, &totalSales, &averagePrice, &totalVolume)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan top cities"})
				return
			}
			analyticsData = append(analyticsData, gin.H{
				"town":          town,
				"total_sales":   totalSales,
				"average_price": averagePrice,
				"total_volume":  totalVolume,
			})
		}
		c.JSON(200, analyticsData)
	})

	// Lista de ciudades
	router.GET("/cities", func(c *gin.Context) {
		var cities []string

		// Primero verificar si la columna existe
		var columnExists bool
		err := pool.QueryRow(context.Background(), `
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'properties' 
				AND column_name = 'town'
			)
		`).Scan(&columnExists)

		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to check column existence", "details": err.Error()})
			return
		}

		if !columnExists {
			c.JSON(500, gin.H{"error": "Column 'town' does not exist in table 'properties'"})
			return
		}

		rows, err := pool.Query(context.Background(), "SELECT DISTINCT town FROM properties WHERE town IS NOT NULL ORDER BY town")
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query cities", "details": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var city string
			err := rows.Scan(&city)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan city", "details": err.Error()})
				return
			}
			cities = append(cities, city)
		}
		c.JSON(200, cities)
	})

	// Obtener lista de tipos de propiedad únicos
	router.GET("/property-types", func(c *gin.Context) {
		var propertyTypes []string

		// Primero verificar si la columna existe
		var columnExists bool
		err := pool.QueryRow(context.Background(), `
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'properties' 
				AND column_name = 'property_type'
			)
		`).Scan(&columnExists)

		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to check column existence", "details": err.Error()})
			return
		}

		if !columnExists {
			c.JSON(500, gin.H{"error": "Column 'property_type' does not exist in table 'properties'"})
			return
		}

		rows, err := pool.Query(context.Background(), "SELECT DISTINCT property_type FROM properties WHERE property_type IS NOT NULL ORDER BY property_type")
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query property types", "details": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var propertyType string
			err := rows.Scan(&propertyType)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan property type", "details": err.Error()})
				return
			}
			propertyTypes = append(propertyTypes, propertyType)
		}
		c.JSON(200, propertyTypes)
	})

	// Obtener lista de tipos residenciales únicos
	router.GET("/residential-types", func(c *gin.Context) {
		var residentialTypes []string
		rows, err := pool.Query(context.Background(), "SELECT DISTINCT residential_type FROM properties WHERE residential_type IS NOT NULL AND residential_type != 'Nan' ORDER BY residential_type")
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query residential types", "details": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var residentialType string
			err := rows.Scan(&residentialType)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan residential type", "details": err.Error()})
				return
			}
			residentialTypes = append(residentialTypes, residentialType)
		}
		c.JSON(200, residentialTypes)
	})

	// Obtener lista de años únicos
	router.GET("/list-years", func(c *gin.Context) {
		var years []int
		rows, err := pool.Query(context.Background(), "SELECT DISTINCT list_year FROM properties WHERE list_year IS NOT NULL ORDER BY list_year")
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query list years", "details": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var year int
			err := rows.Scan(&year)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan year", "details": err.Error()})
				return
			}
			years = append(years, year)
		}
		c.JSON(200, years)
	})

	// Endpoints de KPIs

	// KPIs principales
	router.GET("/analytics/kpis", func(c *gin.Context) {
		var totalProperties int
		err := pool.QueryRow(context.Background(), "SELECT COUNT(*) FROM properties").Scan(&totalProperties)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to get total properties", "details": err.Error()})
			return
		}

		var avgPrice float64
		err = pool.QueryRow(context.Background(), "SELECT AVG(sale_amount) FROM properties WHERE sale_amount > 0").Scan(&avgPrice)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to get average price", "details": err.Error()})
			return
		}

		var avgSalesRatio float64
		err = pool.QueryRow(context.Background(), "SELECT AVG(sales_ratio) FROM properties WHERE sales_ratio > 0").Scan(&avgSalesRatio)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to get average sales ratio", "details": err.Error()})
			return
		}

		var avgYearsUntilSold float64
		err = pool.QueryRow(context.Background(), "SELECT AVG(years_until_sold) FROM properties WHERE years_until_sold >= 0").Scan(&avgYearsUntilSold)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to get average years until sold", "details": err.Error()})
			return
		}

		var topCity string
		var topCityCount int
		err = pool.QueryRow(context.Background(), `
			SELECT town, COUNT(*) as count 
			FROM properties 
			WHERE town IS NOT NULL 
			GROUP BY town 
			ORDER BY count DESC 
			LIMIT 1
		`).Scan(&topCity, &topCityCount)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to get top city", "details": err.Error()})
			return
		}

		var topPropertyType string
		var topPropertyTypeCount int
		err = pool.QueryRow(context.Background(), `
			SELECT property_type, COUNT(*) as count 
			FROM properties 
			WHERE property_type IS NOT NULL 
			GROUP BY property_type 
			ORDER BY count DESC 
			LIMIT 1
		`).Scan(&topPropertyType, &topPropertyTypeCount)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to get top property type", "details": err.Error()})
			return
		}
		c.JSON(200, gin.H{
			"total_properties":         totalProperties,
			"average_price":            avgPrice,
			"average_sales_ratio":      avgSalesRatio,
			"average_years_until_sold": avgYearsUntilSold,
			"top_city": gin.H{
				"name":  topCity,
				"count": topCityCount,
			},
			"top_property_type": gin.H{
				"name":  topPropertyType,
				"count": topPropertyTypeCount,
			},
		})
	})

	// Tendencias por año
	router.GET("/analytics/trends-by-year", func(c *gin.Context) {
		rows, err := pool.Query(context.Background(), `
			SELECT 
				list_year,
				COUNT(*) as total_sales,
				AVG(sale_amount) as avg_price,
				AVG(sales_ratio) as avg_sales_ratio,
				AVG(years_until_sold) as avg_years_until_sold
			FROM properties 
			WHERE list_year IS NOT NULL 
			GROUP BY list_year 
			ORDER BY list_year
		`)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query trends", "details": err.Error()})
			return
		}
		defer rows.Close()

		var trends []gin.H
		for rows.Next() {
			var year int
			var totalSales int
			var avgPrice, avgSalesRatio, avgYearsUntilSold float64

			err := rows.Scan(&year, &totalSales, &avgPrice, &avgSalesRatio, &avgYearsUntilSold)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan trend data"})
				return
			}

			trends = append(trends, gin.H{
				"year":                 year,
				"total_sales":          totalSales,
				"avg_price":            avgPrice,
				"avg_sales_ratio":      avgSalesRatio,
				"avg_years_until_sold": avgYearsUntilSold,
			})
		}

		c.JSON(200, trends)
	})

	// Iniciar servidor
	router.Run(":8080")
}
