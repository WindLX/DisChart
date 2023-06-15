use crate::utils::error::Error;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetPointId {
    main_point_id: usize,
    other_point_id: Vec<usize>,
}

impl TargetPointId {
    pub fn new(main_point_id: usize, other_point_id: Vec<usize>) -> Self {
        TargetPointId {
            main_point_id,
            other_point_id,
        }
    }

    pub fn build(main_id: &str, other_id: &str) -> Result<Self, Error> {
        let main_id = main_id.parse::<usize>();
        match main_id {
            Ok(m) => {
                let re = Regex::new(r"(\d+)-(\d+)|(\d+)").unwrap();

                let mut numbers = Vec::new();
                for caps in re.captures_iter(other_id) {
                    if let Some(range_start) = caps.get(1) {
                        if let Some(range_end) = caps.get(2) {
                            let start: usize = range_start.as_str().parse().unwrap();
                            let end: usize = range_end.as_str().parse().unwrap();
                            numbers.extend(start..=end);
                        }
                    } else if let Some(single_number) = caps.get(3) {
                        let number: usize = single_number.as_str().parse().unwrap();
                        numbers.push(number);
                    }
                }

                let mut unique_sorted_numbers: Vec<usize> = numbers
                    .into_iter()
                    .collect::<HashSet<_>>()
                    .into_iter()
                    .filter(|d| *d != m)
                    .collect();
                unique_sorted_numbers.sort();

                Ok(TargetPointId::new(m, unique_sorted_numbers))
            }
            Err(e) => Err(Error::from(e)),
        }
    }

    pub fn get_main(self) -> usize {
        self.main_point_id
    }

    pub fn get_other(self) -> Vec<usize> {
        self.other_point_id
    }
}
