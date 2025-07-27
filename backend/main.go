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
)

// Estructura para una propiedad individual
type Property struct {
	SerialNumber int64   `json:"serial_number"`
	Town         string  `json:"town"`
	SaleAmount   float64 `json:"sale_amount"`
	PropertyType string  `json:"property_type"`
}

// Estructura para los datos de analíticas
type TownAnalytics struct {
	Town         string  `json:"town"`
	AveragePrice float64 `json:"average_price"`
}

func main() {
	// 1. Conexión a la Base de Datos
	connStr := "postgresql://user_urbanytics:password_urbanytics@localhost:5432/db_urbanytics"
	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())
	fmt.Println("Successfully connected to the database!")

	// 2. Creación del Router y Configuración de CORS
	router := gin.Default()
	router.Use(cors.Default())

	// 3. Definición de Rutas (Endpoints)

	// Ping de prueba
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// --- RUTAS CRUD PARA PROPIEDADES ---

	// CREAR una propiedad
	router.POST("/properties", func(c *gin.Context) {
		var newProperty Property
		if err := c.BindJSON(&newProperty); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request body"})
			return
		}
		sql := "INSERT INTO properties (serial_number, town, sale_amount, property_type) VALUES ($1, $2, $3, $4)"
		_, err := conn.Exec(context.Background(), sql, newProperty.SerialNumber, newProperty.Town, newProperty.SaleAmount, newProperty.PropertyType)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create property", "details": err.Error()})
			return
		}
		c.JSON(201, newProperty)
	})

	// LEER lista de propiedades (con filtro y paginación)
	router.GET("/properties", func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit
		town := c.Query("town")

		baseQuery := "SELECT serial_number, town, sale_amount, property_type FROM properties"
		var conditions []string
		var args []interface{}
		argId := 1

		if town != "" {
			conditions = append(conditions, fmt.Sprintf("town = $%d", argId))
			args = append(args, town)
			argId++
		}
		whereClause := ""
		if len(conditions) > 0 {
			whereClause = " WHERE " + strings.Join(conditions, " AND ")
		}

		finalQuery := fmt.Sprintf("%s%s ORDER BY serial_number LIMIT $%d OFFSET $%d", baseQuery, whereClause, argId, argId+1)
		args = append(args, limit, offset)

		properties := []Property{}
		rows, _ := conn.Query(context.Background(), finalQuery, args...)
		defer rows.Close()
		for rows.Next() {
			var p Property
			_ = rows.Scan(&p.SerialNumber, &p.Town, &p.SaleAmount, &p.PropertyType)
			properties = append(properties, p)
		}
		c.JSON(200, properties)
	})

	// LEER una propiedad por ID
	router.GET("/properties/:id", func(c *gin.Context) {
		id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
		var p Property
		err := conn.QueryRow(context.Background(), "SELECT serial_number, town, sale_amount, property_type FROM properties WHERE serial_number = $1", id).Scan(&p.SerialNumber, &p.Town, &p.SaleAmount, &p.PropertyType)
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

	// ACTUALIZAR una propiedad por ID
	router.PUT("/properties/:id", func(c *gin.Context) {
		id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
		var updatedProperty Property
		_ = c.BindJSON(&updatedProperty)
		sql := "UPDATE properties SET town = $1, sale_amount = $2, property_type = $3 WHERE serial_number = $4"
		tag, _ := conn.Exec(context.Background(), sql, updatedProperty.Town, updatedProperty.SaleAmount, updatedProperty.PropertyType, id)
		if tag.RowsAffected() == 0 {
			c.JSON(404, gin.H{"error": "Property not found"})
			return
		}
		c.JSON(200, updatedProperty)
	})

	// BORRAR una propiedad por ID
	router.DELETE("/properties/:id", func(c *gin.Context) {
		id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
		tag, _ := conn.Exec(context.Background(), "DELETE FROM properties WHERE serial_number = $1", id)
		if tag.RowsAffected() == 0 {
			c.JSON(404, gin.H{"error": "Property not found"})
			return
		}
		c.JSON(200, gin.H{"message": "Property deleted successfully"})
	})

	// --- RUTA DE ANALÍTICAS ---
	router.GET("/analytics/avg-price-by-town", func(c *gin.Context) {
		analyticsData := []TownAnalytics{}
		sql := "SELECT town, AVG(sale_amount) as average_price FROM properties GROUP BY town ORDER BY town"
		rows, _ := conn.Query(context.Background(), sql)
		defer rows.Close()
		for rows.Next() {
			var data TownAnalytics
			_ = rows.Scan(&data.Town, &data.AveragePrice)
			analyticsData = append(analyticsData, data)
		}
		c.JSON(200, analyticsData)
	})

	// 4. Iniciar el Servidor
	router.Run(":8080")
}
