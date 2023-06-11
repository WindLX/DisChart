use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point {
    role: usize,
    id: usize,
    pos_x: f64,
    pos_y: f64,
    pos_z: f64,
}

impl Point {
    pub fn new(role: usize, id: usize, pos_x: f64, pos_y: f64, pos_z: f64) -> Self {
        Point {
            role,
            id,
            pos_x,
            pos_y,
            pos_z,
        }
    }

    pub fn set_position(&mut self, x: f64, y: f64, z: f64) {
        (self.pos_x, self.pos_y, self.pos_z) = (x, y, z);
    }

    pub fn get_position(&self) -> (f64, f64, f64) {
        (self.pos_x, self.pos_y, self.pos_z)
    }

    pub fn get_id(&self) -> usize {
        self.id
    }

    pub fn get_role(&self) -> usize {
        self.role
    }

    pub fn distance(&self, other: Self, is_3d: bool) -> f64 {
        if is_3d {
            ((self.pos_x - other.pos_x).powi(2)
                + (self.pos_y - other.pos_y).powi(2)
                + (self.pos_z - other.pos_z).powi(2))
            .sqrt()
        } else {
            ((self.pos_x - other.pos_x).powi(2) + (self.pos_y - other.pos_y).powi(2)).sqrt()
        }
    }
}
